import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

TIMEFRAMES = {
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60
}

class QuantVolatilityEngine:
    """Quantitative engine for calculating multi-timeframe realized volatility metrics."""

    @staticmethod
    def calculate_window_metrics(prices: List[float]) -> Tuple[float, float, float, float, float, float, float]:
        """
        Calculate quantitative volatility metrics for a window of prices.
        Returns:
            (realized_volatility, price_range_pct, price_change_pct, volatility_score, min_price, max_price, start_price)
        """
        if not prices or len(prices) == 0:
            return 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

        arr = np.array(prices, dtype=np.float64)
        latest_price = arr[-1]
        start_price = arr[0]
        min_price = float(np.min(arr))
        max_price = float(np.max(arr))

        # Net Price Change % over the window
        price_change_pct = float(((latest_price - start_price) / start_price) * 100.0) if start_price > 0 else 0.0

        # Price Range Swing % (High - Low Range Amplitude)
        price_range_pct = float(((max_price - min_price) / min_price) * 100.0) if min_price > 0 else 0.0

        if len(arr) < 2:
            realized_volatility = 0.0
            volatility_score = abs(price_change_pct)
        else:
            # 1-minute percentage returns: r_t = (P_t - P_{t-1}) / P_{t-1}
            returns = np.diff(arr) / arr[:-1]
            
            # Realized Volatility: Standard deviation of returns (expressed in %)
            # Using ddof=1 for sample standard deviation if len >= 2
            std_dev = np.std(returns, ddof=1) if len(returns) > 1 else np.std(returns)
            realized_volatility = float(std_dev * 100.0)

            # Quant Volatility Score: Composite index combining std dev dispersion and range amplitude
            # VolScore = 0.65 * RealizedVol % + 0.35 * Range %
            volatility_score = float(0.65 * realized_volatility + 0.35 * price_range_pct)

        return (
            round(realized_volatility, 4),
            round(price_range_pct, 4),
            round(price_change_pct, 4),
            round(volatility_score, 4),
            min_price,
            max_price,
            start_price
        )

quant_engine = QuantVolatilityEngine()
