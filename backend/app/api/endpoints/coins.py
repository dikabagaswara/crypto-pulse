from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models import Coin, PriceHistory
from app.schemas import CoinResponse, PricePoint, PriceHistoryResponse

router = APIRouter()

@router.get("", response_model=List[CoinResponse])
async def list_coins(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all monitored PINTU coin pairs."""
    query = select(Coin)
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.where(Coin.symbol.like(search_pattern) | Coin.base_currency.like(search_pattern))
    
    query = query.limit(limit)
    result = await db.execute(query)
    coins = result.scalars().all()
    return coins

@router.get("/{symbol:path}/history", response_model=PriceHistoryResponse)
async def get_coin_price_history(
    symbol: str,
    timeframe: str = Query("1h", description="Timeframe window: 5m, 15m, 30m, 1h, 24h"),
    db: AsyncSession = Depends(get_db)
):
    """Get raw price history for a specific coin pair over a timeframe."""
    cleaned_symbol = symbol.lower().strip()

    minutes_map = {
        "5m": 5,
        "15m": 15,
        "30m": 30,
        "1h": 60,
        "24h": 1440
    }
    window_minutes = minutes_map.get(timeframe, 60)
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes + 5)

    stmt = (
        select(PriceHistory)
        .where(
            PriceHistory.symbol == cleaned_symbol,
            PriceHistory.timestamp >= cutoff
        )
        .order_by(PriceHistory.timestamp.asc())
    )
    
    result = await db.execute(stmt)
    history_records = result.scalars().all()

    points = [
        PricePoint(
            timestamp=rec.timestamp,
            price=rec.price,
            day_change_pct=rec.day_change_pct
        )
        for rec in history_records
    ]

    return PriceHistoryResponse(
        symbol=cleaned_symbol,
        timeframe=timeframe,
        points=points
    )
