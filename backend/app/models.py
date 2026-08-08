from sqlalchemy import Column, Integer, String, Float, DateTime, Index, UniqueConstraint
from datetime import datetime, timezone
from app.database import Base

class Coin(Base):
    __tablename__ = "coins"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False)  # e.g. 'btc/idr'
    base_currency = Column(String(20), index=True, nullable=False)        # e.g. 'btc'
    quote_currency = Column(String(20), default="idr", nullable=False)   # e.g. 'idr'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PriceHistory(Base):
    __tablename__ = "price_histories"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), index=True, nullable=False)
    price = Column(Float, nullable=False)
    day_change_pct = Column(Float, nullable=True)    # 24h PINTU change %
    week_change_pct = Column(Float, nullable=True)   # 7d PINTU change %
    month_change_pct = Column(Float, nullable=True)  # 30d PINTU change %
    timestamp = Column(DateTime, index=True, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("idx_symbol_timestamp", "symbol", "timestamp"),
    )

class VolatilityMetric(Base):
    __tablename__ = "volatility_metrics"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), index=True, nullable=False)
    timeframe = Column(String(10), index=True, nullable=False)  # '5m', '15m', '30m', '1h'
    
    realized_volatility = Column(Float, nullable=False)  # Standard deviation of 1m return % over window
    price_range_pct = Column(Float, nullable=False)      # (Max - Min) / Min * 100%
    price_change_pct = Column(Float, nullable=False)     # (Latest - Start) / Start * 100%
    volatility_score = Column(Float, nullable=False)     # Composite Quantitative Volatility Score
    
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    start_price = Column(Float, nullable=False)
    latest_price = Column(Float, nullable=False)
    sample_count = Column(Integer, default=0)
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("symbol", "timeframe", name="uq_symbol_timeframe"),
        Index("idx_timeframe_score", "timeframe", "volatility_score"),
    )
