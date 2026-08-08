from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PintuPriceItem(BaseModel):
    pair: str
    latestPrice: str
    day: Optional[str] = "0.0"
    week: Optional[str] = "0.0"
    month: Optional[str] = "0.0"
    year: Optional[str] = "0.0"

class CoinBase(BaseModel):
    symbol: str
    base_currency: str
    quote_currency: str = "idr"

class CoinResponse(CoinBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PricePoint(BaseModel):
    timestamp: datetime
    price: float
    day_change_pct: Optional[float] = 0.0

    class Config:
        from_attributes = True

class PriceHistoryResponse(BaseModel):
    symbol: str
    timeframe: str
    points: List[PricePoint]

class VolatilityMetricResponse(BaseModel):
    symbol: str
    base_currency: str
    timeframe: str  # '5m', '15m', '30m', '1h'
    latest_price: float
    realized_volatility: float   # StdDev % of returns
    price_range_pct: float       # (Max - Min) / Min * 100%
    price_change_pct: float      # (Latest - Start) / Start * 100%
    volatility_score: float      # Composite quant metric
    min_price: float
    max_price: float
    start_price: float
    sample_count: int
    updated_at: datetime

    class Config:
        from_attributes = True

class VolatilityTimeframeSummary(BaseModel):
    timeframe: str
    top_coin: VolatilityMetricResponse
    avg_market_volatility: float

class DashboardOverviewResponse(BaseModel):
    total_coins_monitored: int
    total_price_snapshots: int
    last_updated: datetime
    top_5m: Optional[VolatilityMetricResponse] = None
    top_15m: Optional[VolatilityMetricResponse] = None
    top_30m: Optional[VolatilityMetricResponse] = None
    top_1h: Optional[VolatilityMetricResponse] = None

class WebSocketMessage(BaseModel):
    event: str  # e.g. "VOLATILITY_UPDATE", "PRICE_TICK"
    timestamp: str
    data: dict
