from fastapi import APIRouter
from app.api.endpoints import coins, volatility, ws

api_router = APIRouter()

api_router.include_router(coins.router, prefix="/coins", tags=["Coins & History"])
api_router.include_router(volatility.router, prefix="/volatility", tags=["Quantitative Volatility"])
api_router.include_router(ws.router, prefix="/ws", tags=["Real-time Stream"])
