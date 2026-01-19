"""Revenue forecasting using Prophet with a graceful fallback."""
from __future__ import annotations

from typing import Dict, List

import pandas as pd

try:  # pragma: no cover - optional dependency
    from prophet import Prophet
except Exception:  # noqa: BLE001
    Prophet = None  # type: ignore


DEFAULT_PERIODS = 30


def forecast_revenue(daily_revenue: pd.DataFrame, periods: int = DEFAULT_PERIODS) -> Dict[str, List[Dict[str, float]]]:
    """Return a 30-day forecast based on the supplied daily revenue dataframe."""
    daily_revenue = daily_revenue.copy()
    if daily_revenue.empty:
        return {"predictions": [], "model": "fallback"}

    if Prophet is None or len(daily_revenue) < 5:
        return _fallback_forecast(daily_revenue, periods)

    model = Prophet(daily_seasonality=True, yearly_seasonality=True)
    model.fit(daily_revenue)
    future = model.make_future_dataframe(periods=periods)
    forecast_df = model.predict(future)
    result = forecast_df.tail(periods)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
    result["ds"] = result["ds"].dt.strftime("%Y-%m-%d")
    return {
        "predictions": result.to_dict(orient="records"),
        "model": "prophet",
    }


def _fallback_forecast(daily_revenue: pd.DataFrame, periods: int) -> Dict[str, List[Dict[str, float]]]:
    """Fallback to a simple moving-average projection when Prophet is unavailable."""
    daily_revenue = daily_revenue.copy()
    daily_revenue["yhat"] = daily_revenue["y"].rolling(window=3, min_periods=1).mean()
    last_date = pd.to_datetime(daily_revenue["ds"].iloc[-1])
    avg_y = float(daily_revenue["y"].mean())
    predictions: List[Dict[str, float]] = []
    for idx in range(1, periods + 1):
        future_date = (last_date + pd.Timedelta(days=idx)).strftime("%Y-%m-%d")
        predictions.append(
            {
                "ds": future_date,
                "yhat": avg_y,
                "yhat_lower": avg_y * 0.9,
                "yhat_upper": avg_y * 1.1,
            }
        )
    return {"predictions": predictions, "model": "moving_average"}
