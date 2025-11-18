"""Identify revenue anomalies."""
from __future__ import annotations

from typing import Dict, List

import numpy as np
import pandas as pd

try:  # pragma: no cover - optional dependency
    from sklearn.ensemble import IsolationForest
except Exception:  # noqa: BLE001
    IsolationForest = None  # type: ignore


def detect_anomalies(daily_revenue: pd.DataFrame) -> Dict[str, List[Dict[str, float]]]:
    """Return anomalies for the provided daily revenue dataframe."""
    daily_revenue = daily_revenue.copy()
    if daily_revenue.empty:
        return {"anomalies": [], "model": "fallback"}

    if IsolationForest is None or len(daily_revenue) < 7:
        return _fallback_detection(daily_revenue)

    model = IsolationForest(contamination=0.1, random_state=42)
    scores = model.fit_predict(daily_revenue[["y"]])
    daily_revenue["is_anomaly"] = scores == -1
    anomalies = daily_revenue[daily_revenue["is_anomaly"]]
    result = [
        {"ds": str(row["ds"]), "y": float(row["y"])}
        for _, row in anomalies.iterrows()
    ]
    return {"anomalies": result, "model": "isolation_forest"}


def _fallback_detection(daily_revenue: pd.DataFrame) -> Dict[str, List[Dict[str, float]]]:
    values = daily_revenue["y"].astype(float)
    mean = float(values.mean())
    std = float(values.std(ddof=0)) or 1.0
    z_scores = np.abs((values - mean) / std)
    mask = z_scores > 2.5
    anomalies = daily_revenue[mask]
    result = [
        {"ds": str(row["ds"]), "y": float(row["y"])}
        for _, row in anomalies.iterrows()
    ]
    return {"anomalies": result, "model": "zscore"}
