"""Customer segmentation module (RFM + KMeans fallback)."""
from __future__ import annotations

from typing import Dict, List

import pandas as pd

try:  # pragma: no cover - optional dependency
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
except Exception:  # noqa: BLE001
    KMeans = None  # type: ignore
    StandardScaler = None  # type: ignore

from .utils import DataFrames


SEGMENT_NAMES = ["VIP", "Loyal", "Promising", "Dormant"]


def segment_customers(tables: DataFrames, n_clusters: int = 4) -> Dict[str, List[Dict[str, object]]]:
    """Return RFM customer segments."""
    invoices = tables.invoice.copy()
    if invoices.empty:
        return {"customers": [], "summary": []}

    created_col = "created_at" if "created_at" in invoices else "createdAt"
    invoices[created_col] = pd.to_datetime(invoices[created_col])
    invoices["created_at"] = invoices[created_col]
    reference_date = invoices["created_at"].max()

    rfm = (
        invoices.groupby("customer_id")
        .agg(
            recency=("created_at", lambda s: (reference_date - s.max()).days),
            frequency=("id", "count"),
            monetary=("total", "sum"),
        )
        .reset_index()
    )

    if KMeans is not None and len(rfm) >= n_clusters:
        scaler = StandardScaler()
        features = scaler.fit_transform(rfm[["recency", "frequency", "monetary"]])
        model = KMeans(n_clusters=n_clusters, n_init="auto", random_state=42)
        rfm["segment_id"] = model.fit_predict(features)
        labels = _map_segments_by_spend(rfm)
    else:
        labels = _fallback_segment_labels(rfm)
        rfm["segment_id"] = rfm["segment"].apply(SEGMENT_NAMES.index)  # type: ignore[index]

    rfm["segment"] = rfm.apply(lambda row: labels.get(row["segment_id"], "Dormant"), axis=1)
    summary = (
        rfm.groupby("segment")
        .agg(customer_count=("customer_id", "count"), avg_spend=("monetary", "mean"))
        .reset_index()
        .sort_values("avg_spend", ascending=False)
    )

    return {
        "customers": rfm.to_dict(orient="records"),
        "summary": summary.to_dict(orient="records"),
    }


def _map_segments_by_spend(rfm: pd.DataFrame) -> Dict[int, str]:
    ranked = (
        rfm.groupby("segment_id")["monetary"].mean().sort_values(ascending=False).reset_index(drop=False)
    )
    labels = {}
    for idx, (_, row) in enumerate(ranked.iterrows()):
        labels[int(row["segment_id"])] = SEGMENT_NAMES[idx] if idx < len(SEGMENT_NAMES) else f"Group {idx+1}"
    return labels


def _fallback_segment_labels(rfm: pd.DataFrame) -> Dict[int, str]:
    quantiles = rfm.quantile(q=[0.25, 0.5, 0.75])
    segments = []
    for _, row in rfm.iterrows():
        score = 0
        score += 1 if row["recency"] <= quantiles.loc[0.25, "recency"] else 0
        score += 1 if row["frequency"] >= quantiles.loc[0.75, "frequency"] else 0
        score += 1 if row["monetary"] >= quantiles.loc[0.75, "monetary"] else 0
        if score >= 2:
            segments.append("VIP")
        elif score == 1:
            segments.append("Loyal")
        else:
            segments.append("Dormant")
    rfm["segment"] = segments
    return {idx: name for idx, name in enumerate(sorted(set(segments), reverse=True))}
