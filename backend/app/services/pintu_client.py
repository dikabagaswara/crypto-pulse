import httpx
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class PintuAPIClient:
    def __init__(self):
        self.url = settings.PINTU_PRICE_URL
        self.headers = {
            "User-Agent": settings.PINTU_USER_AGENT,
            "Accept": "application/json"
        }

    async def fetch_latest_prices(self) -> List[Dict[str, Any]]:
        """Fetch latest price changes for all currency pairs from PINTU Exchange API."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(self.url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == "success" and "payload" in data:
                    return data["payload"]
                else:
                    logger.error(f"Unexpected response structure from PINTU API: {data}")
                    return []
            except httpx.HTTPStatusError as exc:
                logger.error(f"HTTP error occurred while fetching PINTU prices: {exc.response.status_code} - {exc.response.text}")
                return []
            except Exception as exc:
                logger.error(f"Failed to fetch prices from PINTU API: {str(exc)}")
                return []

pintu_client = PintuAPIClient()
