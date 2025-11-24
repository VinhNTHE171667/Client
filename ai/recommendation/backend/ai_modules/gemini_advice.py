"""Gemini LLM integration for strategic recommendations."""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List

import requests

from .utils import export_to_json, load_env


DEFAULT_INSIGHTS = [
    {
        "title": "Tăng doanh thu 12% với Combo VIP",
        "description": "Kết hợp dịch vụ Massage & Facial cho nhóm khách Dormant nhằm kích hoạt lại.",
        "impact": "+12%",
        "effort": "Medium",
    },
    {
        "title": "Đẩy mạnh upsell ngày cuối tuần",
        "description": "Triển khai ưu đãi 10% cho gói chăm sóc da nâng cao vào thứ 6 - CN để tối ưu công suất.",
        "impact": "+8%",
        "effort": "Low",
    },
]


def generate_insights(context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Call Gemini Vertex API to generate insights; fallback to canned suggestions."""
    load_env()
    api_key = os.getenv("VERTEX_API_KEY")
    endpoint = os.getenv("VERTEX_ENDPOINT")

    if not api_key or not endpoint:
        return _local_brainstorm(context)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    prompt = _build_prompt(context)
    payload = {"instances": [{"prompt": prompt}]}

    try:
        response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        insights = _parse_response(response.json())
        export_to_json({"context": context, "insights": insights}, "outputs/advice.json")
        return insights
    except Exception:  # noqa: BLE001
        return _local_brainstorm(context)


def _parse_response(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    predictions = data.get("predictions")
    if isinstance(predictions, list) and predictions:
        candidate = predictions[0]
        text = None
        if isinstance(candidate, dict):
            text = candidate.get("content") or candidate.get("output")
        elif isinstance(candidate, str):
            text = candidate
        if text:
            try:
                insights = json.loads(text)
                if isinstance(insights, list):
                    return insights
            except json.JSONDecodeError:
                pass
    return DEFAULT_INSIGHTS


def _build_prompt(context: Dict[str, Any]) -> str:
    return (
        "Bạn là chuyên gia tư vấn kinh doanh cho chuỗi spa Việt Nam. "
        "Dựa trên dữ liệu KPI, dự báo doanh thu, phân khúc khách hàng và những ngày bất thường, "
        "hãy đề xuất 6 chiến lược tăng trưởng. "
        "Hãy trả về kết quả dạng JSON list, mỗi phần tử gồm title, description, impact, effort.\n\n"
        f"Dữ liệu đầu vào:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
    )


def _local_brainstorm(context: Dict[str, Any]) -> List[Dict[str, Any]]:
    del context  # not used in fallback but kept for parity
    export_to_json({"insights": DEFAULT_INSIGHTS}, "outputs/advice.json")
    return DEFAULT_INSIGHTS
