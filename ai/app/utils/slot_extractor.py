import logging
from functools import lru_cache
from datetime import date
from typing import Any

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from pydantic import BaseModel, Field

from app.core.model_provider import get_chat_model

logger = logging.getLogger(__name__)


class BookingSlotPayload(BaseModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_email: str | None = None
    date: str | None = None
    time: str | None = None
    services: list[str] = Field(default_factory=list)
    notes: str | None = None


_BOOKING_OUTPUT_PARSER = PydanticOutputParser(pydantic_object=BookingSlotPayload)
@lru_cache(maxsize=1)
def _get_booking_chain() -> Runnable:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Bạn là trợ lý chuẩn hoá dữ liệu đặt lịch spa. "
                    "Trả về JSON duy nhất với cấu trúc {{\"customer_name\": str|null, \"customer_phone\": str|null, "
                    "\"customer_email\": str|null, \"date\": \"YYYY-MM-DD\"|null, \"time\": \"HH:MM\"|null, \"services\": [str], \"notes\": str|null}}. "
                    "Ngày tham chiếu hiện tại (Asia/Ho_Chi_Minh) là {reference_date}. "
                    "Nếu khách dùng các cụm như 'chiều nay', 'ngày mai', 'tuần sau', hoặc thời gian dạng '5 giờ chiều', hãy chuyển đổi sang định dạng chuẩn. "
                    "Chuẩn hoá số điện thoại chỉ giữ chữ số Việt Nam. Đảm bảo email (nếu có) đúng định dạng chuẩn. Không giải thích, không thêm text ngoài JSON."
                    "\n\nTuân thủ định dạng sau:\n{format_instructions}"
                ),
            ),
            ("human", "Khách nói: {query}"),
        ]
    )
    return prompt | get_chat_model() | _BOOKING_OUTPUT_PARSER


def extract_booking_slots(query: str) -> dict:
    today_iso = date.today().isoformat()
    params: dict[str, Any] = {
        "query": query,
        "reference_date": today_iso,
        "format_instructions": _BOOKING_OUTPUT_PARSER.get_format_instructions(),
    }
    try:
        structured = _get_booking_chain().invoke(params)
    except Exception as err:  # noqa: BLE001
        logger.error("LLM booking chain failed: %s", err)
        raise

    response_dict = structured.dict() if isinstance(structured, BookingSlotPayload) else structured
    response_dict = _ensure_schema(response_dict)
    if not isinstance(response_dict, dict):
        logger.error("Unexpected payload type from booking chain: %s", type(response_dict))
        raise ValueError("Booking chain returned non-dict payload")
    return response_dict


def _ensure_schema(payload: dict) -> dict:
    sanitized: dict[str, Any] = {
        "customer_name": None,
        "customer_phone": None,
    "customer_email": None,
        "date": None,
        "time": None,
        "services": [],
        "notes": None,
    }
    aliases = {
        "customer_name": ["customer_name", "name", "full_name"],
        "customer_phone": ["customer_phone", "phone", "contact_phone", "so_dien_thoai"],
    "customer_email": ["customer_email", "email", "contact_email"],
        "date": ["date", "booking_date", "ngay"],
        "time": ["time", "booking_time", "gio"],
        "services": ["services", "service", "booking_services"],
        "notes": ["notes", "ghi_chu", "note"],
    }
    for key, candidates in aliases.items():
        for candidate in candidates:
            if candidate in payload and payload[candidate] not in (None, ""):
                sanitized[key] = payload[candidate]
                break

    services = sanitized["services"]
    if isinstance(services, str):
        services = [services]
    elif isinstance(services, list):
        normalized = []
        for item in services:
            if isinstance(item, dict) and "name" in item:
                normalized.append(str(item["name"]))
            elif item:
                normalized.append(str(item))
        services = normalized
    else:
        services = []
    sanitized["services"] = services
    return sanitized
