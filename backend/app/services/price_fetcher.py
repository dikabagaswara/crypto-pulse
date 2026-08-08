import asyncio
import logging
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from app.database import AsyncSessionLocal
from app.models import Coin, PriceHistory, VolatilityMetric
from app.services.pintu_client import pintu_client
from app.services.quant_engine import quant_engine, TIMEFRAMES
from app.services.websocket_mgr import ws_manager
from app.config import settings

logger = logging.getLogger(__name__)

async def seed_initial_buffer_if_needed():
    """Seed historical buffer (past 60 mins) if database is newly initialized."""
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(func.count(PriceHistory.id)))
            count = result.scalar() or 0
            
            if count >= 600:
                logger.info(f"Database already has {count} price records. Skipping seed.")
                return

            logger.info("Database has low/empty history. Fetching current PINTU prices to seed 60-minute buffer...")
            raw_prices = await pintu_client.fetch_latest_prices()
            if not raw_prices:
                logger.warning("Failed to fetch PINTU prices for seeding.")
                return

            now = datetime.now(timezone.utc)
            # Take top active coins or all pairs
            pairs_to_seed = raw_prices[:150]  # Seed top 150 pairs for fast startup

            history_batch = []
            for item in pairs_to_seed:
                symbol = item["pair"].lower()
                try:
                    base_price = float(item["latestPrice"])
                except (ValueError, TypeError):
                    continue

                if base_price <= 0:
                    continue

                # Parse optional percentage changes
                try:
                    day_change = float(item.get("day", "0.0") or "0.0")
                except ValueError:
                    day_change = 0.0

                # Generate 60 minutes of realistic Brownian random walk price movements around current price
                current_p = base_price
                for minute_offset in range(60, 0, -1):
                    ts = now - timedelta(minutes=minute_offset)
                    # Random volatility factor based on coin type
                    vol_factor = 0.003 if "btc" in symbol or "eth" in symbol else 0.008
                    shock = random.gauss(0, vol_factor)
                    current_p = current_p * (1.0 + shock)
                    
                    history_batch.append(
                        PriceHistory(
                            symbol=symbol,
                            price=round(current_p, 8),
                            day_change_pct=day_change,
                            timestamp=ts
                        )
                    )

            if history_batch:
                db.add_all(history_batch)
                await db.commit()
                logger.info(f"Successfully seeded {len(history_batch)} historical price snapshots across 60 minutes.")

            # Compute initial volatility metrics
            await calculate_and_update_all_volatility_metrics(db)

        except Exception as e:
            logger.error(f"Error during historical buffer seeding: {str(e)}", exc_info=True)
            await db.rollback()

async def calculate_and_update_all_volatility_metrics(db):
    """Query recent history for all coins and compute 5m, 15m, 30m, and 1h volatility."""
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(minutes=65)

    # Fetch all prices in the last 65 minutes
    stmt = (
        select(PriceHistory.symbol, PriceHistory.price, PriceHistory.timestamp)
        .where(PriceHistory.timestamp >= one_hour_ago)
        .order_by(PriceHistory.symbol, PriceHistory.timestamp.asc())
    )
    result = await db.execute(stmt)
    records = result.all()

    # Group price series by symbol
    coin_histories = {}
    for symbol, price, ts in records:
        if symbol not in coin_histories:
            coin_histories[symbol] = []
        coin_histories[symbol].append(price)

    # Process each symbol across all timeframes
    updates = []
    for symbol, prices in coin_histories.items():
        if not prices:
            continue

        for tf_name, tf_minutes in TIMEFRAMES.items():
            # Slice prices for window length
            window_prices = prices[-tf_minutes:] if len(prices) >= tf_minutes else prices
            
            (
                realized_vol,
                price_range_pct,
                price_change_pct,
                vol_score,
                min_p,
                max_p,
                start_p
            ) = quant_engine.calculate_window_metrics(window_prices)

            latest_p = prices[-1]

            # Upsert volatility metric
            stmt_sel = select(VolatilityMetric).where(
                VolatilityMetric.symbol == symbol,
                VolatilityMetric.timeframe == tf_name
            )
            existing = (await db.execute(stmt_sel)).scalar_one_or_none()

            if existing:
                existing.realized_volatility = realized_vol
                existing.price_range_pct = price_range_pct
                existing.price_change_pct = price_change_pct
                existing.volatility_score = vol_score
                existing.min_price = min_p
                existing.max_price = max_p
                existing.start_price = start_p
                existing.latest_price = latest_p
                existing.sample_count = len(window_prices)
                existing.updated_at = now
            else:
                new_metric = VolatilityMetric(
                    symbol=symbol,
                    timeframe=tf_name,
                    realized_volatility=realized_vol,
                    price_range_pct=price_range_pct,
                    price_change_pct=price_change_pct,
                    volatility_score=vol_score,
                    min_price=min_p,
                    max_price=max_p,
                    start_price=start_p,
                    latest_price=latest_p,
                    sample_count=len(window_prices),
                    updated_at=now
                )
                db.add(new_metric)

    await db.commit()

async def fetch_and_process_prices():
    """Worker task executed every 1 minute to fetch PINTU prices, store snapshots & update metrics."""
    logger.info("Executing 1-minute PINTU price fetch worker...")
    raw_prices = await pintu_client.fetch_latest_prices()
    if not raw_prices:
        logger.warning("No price data returned from PINTU API.")
        return

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        try:
            history_objects = []
            symbols_updated = []

            for item in raw_prices:
                symbol = item["pair"].lower()
                try:
                    latest_price = float(item["latestPrice"])
                except (ValueError, TypeError):
                    continue

                if latest_price <= 0:
                    continue

                try:
                    day_change = float(item.get("day", "0.0") or "0.0")
                    week_change = float(item.get("week", "0.0") or "0.0")
                    month_change = float(item.get("month", "0.0") or "0.0")
                except ValueError:
                    day_change = 0.0
                    week_change = 0.0
                    month_change = 0.0

                base = symbol.split("/")[0] if "/" in symbol else symbol

                # Ensure coin registration
                coin_stmt = select(Coin).where(Coin.symbol == symbol)
                coin = (await db.execute(coin_stmt)).scalar_one_or_none()
                if not coin:
                    db.add(Coin(symbol=symbol, base_currency=base, quote_currency="idr"))

                # Add price history entry
                history_objects.append(
                    PriceHistory(
                        symbol=symbol,
                        price=latest_price,
                        day_change_pct=day_change,
                        week_change_pct=week_change,
                        month_change_pct=month_change,
                        timestamp=now
                    )
                )
                symbols_updated.append(symbol)

            if history_objects:
                db.add_all(history_objects)
                await db.commit()
                logger.info(f"Recorded new 1-minute price snapshot for {len(history_objects)} coins.")

            # Compute updated volatility metrics across all timeframes
            await calculate_and_update_all_volatility_metrics(db)

            # Broadcast real-time WebSocket tick notification to clients
            await ws_manager.broadcast({
                "event": "VOLATILITY_TICK",
                "timestamp": now.isoformat(),
                "total_coins": len(symbols_updated),
                "message": f"Updated volatility metrics for {len(symbols_updated)} PINTU coins."
            })

        except Exception as e:
            logger.error(f"Error in price fetch worker: {str(e)}", exc_info=True)
            await db.rollback()

async def start_price_scheduler():
    """Background scheduler loop running every settings.FETCH_INTERVAL_SECONDS."""
    logger.info("Initializing PINTU price fetch scheduler...")
    await seed_initial_buffer_if_needed()

    while True:
        try:
            await fetch_and_process_prices()
        except Exception as e:
            logger.error(f"Unexpected error in scheduler loop: {str(e)}")
        await asyncio.sleep(settings.FETCH_INTERVAL_SECONDS)
