"""KPI analytics powered by pandas."""
from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd

from .utils import DataFrames, export_to_json, load_dataframes


def compute_kpis(tables: DataFrames) -> Dict[str, object]:
    """Compute core KPIs used by the dashboard."""
    invoices = tables.invoice.copy()
    appointments = tables.appointment.copy()
    invoice_detail = tables.invoice_detail.copy()
    services = tables.service.copy()

    created_col = "created_at" if "created_at" in invoices else "createdAt"
    invoices[created_col] = pd.to_datetime(invoices[created_col])
    invoices["created_at"] = invoices[created_col]

    schedule_col = "scheduled_date" if "scheduled_date" in appointments else "appointment_date"
    appointments[schedule_col] = pd.to_datetime(appointments[schedule_col])
    appointments["scheduled_date"] = appointments[schedule_col]

    total_revenue = float(invoices["total"].sum())
    avg_ticket = float(invoices["total"].mean()) if not invoices.empty else 0.0
    num_customers = int(invoices["customer_id"].nunique())

    # Retention = customers with >=2 invoices divided by total customers
    returning = invoices.groupby("customer_id").size()
    returning_count = int((returning > 1).sum())
    retention_rate = float(returning_count / num_customers) if num_customers else 0.0

    # No-show / cancel rate based on appointment status
    cancelled = (appointments["status"].str.lower() == "cancelled").sum()
    no_show_rate = float(cancelled / len(appointments)) if len(appointments) else 0.0

    monthly_revenue = (
        invoices.set_index("created_at")["total"].resample("M").sum().reset_index()
        if not invoices.empty
        else pd.DataFrame(columns=["created_at", "total"])
    )
    monthly_revenue["month"] = monthly_revenue["created_at"].dt.strftime("%Y-%m")

    # Join invoice detail with services to understand best sellers
    top_services: List[Dict[str, object]] = []
    if not invoice_detail.empty:
        detail = invoice_detail.merge(services, left_on="service_id", right_on="id", how="left")
        service_stats = (
            detail.assign(revenue=lambda df: df["quantity"] * df["unit_price"])
            .groupby(["service_id", "name"])
            .agg({"quantity": "sum", "revenue": "sum"})
            .reset_index()
            .sort_values("revenue", ascending=False)
        )
        top_services = service_stats.head(5).to_dict(orient="records")

    return {
        "total_revenue": total_revenue,
        "avg_ticket": avg_ticket,
        "num_customers": num_customers,
        "retention_rate": retention_rate,
        "no_show_rate": no_show_rate,
        "forecast_ready": True,
        "segments_ready": True,
        "anomaly_ready": True,
        "monthly_revenue": monthly_revenue[["month", "total"]].to_dict(orient="records"),
        "top_services": top_services,
    }


def compute_kpis_window(tables: DataFrames, window_days: int = 30) -> Dict[str, object]:
    """Compute KPIs restricted to the most recent `window_days` days.

    This is useful for admin views that want fast recent-period summaries.
    """
    invoices = tables.invoice.copy()
    if invoices.empty:
        return compute_kpis(tables)

    created_col = "created_at" if "created_at" in invoices else "createdAt"
    invoices[created_col] = pd.to_datetime(invoices[created_col])
    cutoff = pd.Timestamp.now() - pd.Timedelta(days=window_days)
    recent_invoices = invoices[invoices[created_col] >= cutoff]

    # Build a temporary DataFrames container with filtered invoices
    temp = DataFrames(
        appointment=tables.appointment,
        invoice=recent_invoices,
        invoice_detail=tables.invoice_detail,
        customer=tables.customer,
        service=tables.service,
    )
    return compute_kpis(temp)


def daily_revenue(tables: DataFrames) -> pd.DataFrame:
    """Aggregate invoices by day for forecasting and anomaly detection."""
    invoices = tables.invoice.copy()
    if invoices.empty:
        return pd.DataFrame(columns=["ds", "y"])
    created_col = "created_at" if "created_at" in invoices else "createdAt"
    invoices[created_col] = pd.to_datetime(invoices[created_col])
    daily = invoices.groupby(invoices[created_col].dt.date)["total"].sum().reset_index()
    daily.columns = ["ds", "y"]
    return daily


def run_recommendation(force_refresh: bool = True) -> Dict[str, Any]:
    """Execute the end-to-end analytics flow and persist summary outputs."""
    tables = load_dataframes(force_refresh=force_refresh)
    kpis = compute_kpis(tables)
    export_to_json(kpis, "outputs/kpi_summary.json")

    daily = daily_revenue(tables)
    # Import within function to avoid circular dependencies at module load time
    from . import anomaly, forecast, gemini_advice, segment

    forecast_payload = forecast.forecast_revenue(daily)
    segment_payload = segment.segment_customers(tables)
    anomaly_payload = anomaly.detect_anomalies(daily)
    advice_payload = gemini_advice.generate_insights(
        {
            "kpi": kpis,
            "forecast": forecast_payload,
            "segments": segment_payload,
            "anomaly": anomaly_payload,
        }
    )

    summary = {
        "kpi": kpis,
        "forecast": forecast_payload,
        "segments": segment_payload,
        "anomaly": anomaly_payload,
        "advice": advice_payload,
    }
    export_to_json(summary, "outputs/recommendation_run.json")
    return summary
