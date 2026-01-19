"""Streamlit dashboard for the Spa AI Data Analytics Platform."""
from __future__ import annotations

import os
from typing import Any, Dict

import pandas as pd
import plotly.express as px
import requests
import streamlit as st

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")


@st.cache_data(ttl=300)
def fetch_json(endpoint: str, method: str = "GET", payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    url = f"{API_BASE_URL}{endpoint}"
    try:
        if method == "POST":
            response = requests.post(url, json=payload or {}, timeout=30)
        else:
            response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as exc:  # noqa: BLE001
        st.error(f"Không gọi được API {endpoint}: {exc}")
        return {}


def kpi_cards(kpi: Dict[str, Any]) -> None:
    cols = st.columns(4)
    cols[0].metric("Tổng doanh thu", f"{kpi.get('total_revenue', 0):,.0f} ₫")
    cols[1].metric("Giá trị đơn trung bình", f"{kpi.get('avg_ticket', 0):,.0f} ₫")
    cols[2].metric("Số khách hàng", int(kpi.get("num_customers", 0)))
    cols[3].metric("Tỷ lệ quay lại", f"{kpi.get('retention_rate', 0)*100:.1f}%")


def main() -> None:
    st.set_page_config(page_title="Spa AI Analytics", layout="wide")
    st.title("📊 Spa AI Data Analytics Platform")
    st.markdown("""
    Chào mừng bạn đến với bảng điều khiển thông minh. Ấn nút bên dưới để tải dữ liệu mới nhất
    từ dịch vụ phân tích AI.
    """)

    if st.button("Phân tích dữ liệu nâng cao 🔮", type="primary"):
        st.cache_data.clear()

    kpi = fetch_json("/api/analyze")
    if kpi:
        kpi_cards(kpi)

    tab_overview, tab_forecast, tab_segment, tab_alerts, tab_advice = st.tabs(
        ["KPI Tổng quan", "Dự báo AI", "Phân nhóm KH", "Cảnh báo", "Lời khuyên AI"]
    )

    with tab_overview:
        if kpi:
            monthly = pd.DataFrame(kpi.get("monthly_revenue", []))
            if not monthly.empty:
                fig = px.bar(monthly, x="month", y="total", title="Doanh thu theo tháng")
                st.plotly_chart(fig, use_container_width=True)
            services = pd.DataFrame(kpi.get("top_services", []))
            if not services.empty:
                st.subheader("Top dịch vụ")
                st.dataframe(services)
        else:
            st.info("Chưa có dữ liệu KPI")

    with tab_forecast:
        forecast_data = fetch_json("/api/forecast")
        predictions = pd.DataFrame(forecast_data.get("predictions", []))
        if not predictions.empty:
            fig = px.line(predictions, x="ds", y="yhat", title="Dự báo doanh thu 30 ngày")
            fig.add_scatter(x=predictions["ds"], y=predictions["yhat_lower"], name="Thấp", mode="lines", line=dict(dash="dash"))
            fig.add_scatter(x=predictions["ds"], y=predictions["yhat_upper"], name="Cao", mode="lines", line=dict(dash="dash"))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Chưa có dữ liệu dự báo")

    with tab_segment:
        segments = fetch_json("/api/segment")
        summary = pd.DataFrame(segments.get("summary", []))
        if not summary.empty:
            fig = px.pie(summary, names="segment", values="customer_count", title="Tỷ trọng khách hàng")
            st.plotly_chart(fig, use_container_width=True)
            st.dataframe(summary)
        else:
            st.info("Chưa có dữ liệu phân khúc")

    with tab_alerts:
        anomalies = fetch_json("/api/anomaly").get("anomalies", [])
        table = pd.DataFrame(anomalies)
        if not table.empty:
            st.dataframe(table.style.apply(lambda _: ["background-color: #ffcccc"] * len(table.columns), axis=1))
        else:
            st.success("Không có cảnh báo bất thường")

    with tab_advice:
        advice_payload = fetch_json("/api/advice", method="POST", payload=kpi)
        items = advice_payload.get("advice", [])
        if items:
            for tip in items:
                with st.container(border=True):
                    st.subheader(tip.get("title", ""))
                    st.write(tip.get("description", ""))
                    col1, col2 = st.columns(2)
                    col1.caption(f"Impact: {tip.get('impact', 'N/A')}")
                    col2.caption(f"Effort: {tip.get('effort', 'N/A')}")
        else:
            st.info("Chưa có lời khuyên từ AI")


if __name__ == "__main__":
    main()
