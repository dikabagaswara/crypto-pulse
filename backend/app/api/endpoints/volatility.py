from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models import VolatilityMetric, PriceHistory, Coin
from app.schemas import (
    VolatilityMetricResponse,
    DashboardOverviewResponse,
    VolatilityTimeframeSummary
)

router = APIRouter()

@router.get("/top", response_model=List[VolatilityMetricResponse])
async def get_top_volatile_coins(
    timeframe: str = Query("15m", description="Timeframe: 5m, 15m, 30m, 1h"),
    sort_by: str = Query("volatility_score", description="Sort by: volatility_score, realized_volatility, price_range_pct, price_change_pct"),
    search: Optional[str] = None,
    limit: int = Query(20, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    Get Top Volatile Coins for a given timeframe (5m, 15m, 30m, 1h),
    sorted by Quantitative Volatility Score or Realized Volatility.
    """
    if timeframe not in ["5m", "15m", "30m", "1h"]:
        raise HTTPException(status_code=400, detail="Invalid timeframe. Must be one of: 5m, 15m, 30m, 1h")

    valid_sort_fields = {
        "volatility_score": VolatilityMetric.volatility_score,
        "realized_volatility": VolatilityMetric.realized_volatility,
        "price_range_pct": VolatilityMetric.price_range_pct,
        "price_change_pct": VolatilityMetric.price_change_pct
    }

    sort_col = valid_sort_fields.get(sort_by, VolatilityMetric.volatility_score)

    stmt = select(VolatilityMetric).where(VolatilityMetric.timeframe == timeframe)

    if search:
        pattern = f"%{search.lower().strip()}%"
        stmt = stmt.where(VolatilityMetric.symbol.like(pattern))

    stmt = stmt.order_by(desc(sort_col)).limit(limit)

    result = await db.execute(stmt)
    metrics = result.scalars().all()

    # Attach base currency name
    response_list = []
    for item in metrics:
        base = item.symbol.split("/")[0] if "/" in item.symbol else item.symbol
        res = VolatilityMetricResponse(
            symbol=item.symbol,
            base_currency=base.upper(),
            timeframe=item.timeframe,
            latest_price=item.latest_price,
            realized_volatility=item.realized_volatility,
            price_range_pct=item.price_range_pct,
            price_change_pct=item.price_change_pct,
            volatility_score=item.volatility_score,
            min_price=item.min_price,
            max_price=item.max_price,
            start_price=item.start_price,
            sample_count=item.sample_count,
            updated_at=item.updated_at
        )
        response_list.append(res)

    return response_list

@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    """Get high-level summary overview of volatility across all monitored coins."""
    # Count total coins monitored
    coin_count_stmt = select(func.count(Coin.id))
    total_coins = (await db.execute(coin_count_stmt)).scalar() or 0

    # Count total price snapshots stored
    history_count_stmt = select(func.count(PriceHistory.id))
    total_snapshots = (await db.execute(history_count_stmt)).scalar() or 0

    # Helper function to get top coin metric for timeframe
    async def get_top_for_tf(tf: str) -> Optional[VolatilityMetricResponse]:
        stmt = (
            select(VolatilityMetric)
            .where(VolatilityMetric.timeframe == tf)
            .order_by(desc(VolatilityMetric.volatility_score))
            .limit(1)
        )
        item = (await db.execute(stmt)).scalar_one_or_none()
        if not item:
            return None
        base = item.symbol.split("/")[0] if "/" in item.symbol else item.symbol
        return VolatilityMetricResponse(
            symbol=item.symbol,
            base_currency=base.upper(),
            timeframe=item.timeframe,
            latest_price=item.latest_price,
            realized_volatility=item.realized_volatility,
            price_range_pct=item.price_range_pct,
            price_change_pct=item.price_change_pct,
            volatility_score=item.volatility_score,
            min_price=item.min_price,
            max_price=item.max_price,
            start_price=item.start_price,
            sample_count=item.sample_count,
            updated_at=item.updated_at
        )

    top_5m = await get_top_for_tf("5m")
    top_15m = await get_top_for_tf("15m")
    top_30m = await get_top_for_tf("30m")
    top_1h = await get_top_for_tf("1h")

    return DashboardOverviewResponse(
        total_coins_monitored=total_coins,
        total_price_snapshots=total_snapshots,
        last_updated=datetime.now(timezone.utc),
        top_5m=top_5m,
        top_15m=top_15m,
        top_30m=top_30m,
        top_1h=top_1h
    )
