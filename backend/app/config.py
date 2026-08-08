from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PINTU Quant Volatility Dashboard"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Configuration (Defaults to SQLite for instant plug-and-play, PostgreSQL compatible via asyncpg)
    DATABASE_URL: str = "sqlite+aiosqlite:///./pintu_quant.db"
    
    # PINTU Exchange API Endpoints
    PINTU_PRICE_URL: str = "https://api.pintu.co.id/v2/trade/price-changes"
    PINTU_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    
    # Polling & Quant Engine Settings
    FETCH_INTERVAL_SECONDS: int = 60  # 1 minute standard interval
    SEED_HISTORICAL_DATA: bool = True  # Auto-generate realistic buffer if history is < 60 mins
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
