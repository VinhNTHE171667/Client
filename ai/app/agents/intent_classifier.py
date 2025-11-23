import logging
from typing import Literal

from langchain_core.prompts import ChatPromptTemplate

from app.core.model_provider import get_chat_model

logger = logging.getLogger(__name__)

IntentType = Literal["book_slot", "rag_query", "smalltalk"]


class IntentClassifier:
    def __init__(self) -> None:
        self._heuristics = {
            "book_slot": {"đặt", "dat", "lịch", "lich", "book", "slot", "hẹn", "hen", "bắt đầu", "bat dau"},
            "rag_query": {"giá", "bao nhiêu", "khuyến mãi", "chính sách", "policy", "dịch vụ"},
        }
        self._prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Bạn phân loại intent câu hỏi khách hàng spa. Chỉ trả về một trong các nhãn: 'book_slot', 'rag_query', 'smalltalk'.",
                ),
                ("human", "Câu: {query}"),
            ]
        )

    def predict(self, query: str) -> IntentType:
        normalized = query.lower()
        for intent, keywords in self._heuristics.items():
            if any(keyword in normalized for keyword in keywords):
                return intent  # type: ignore[return-value]
        try:
            response = get_chat_model().invoke(self._prompt.format_messages(query=query))
            label = response.content.strip().lower()
            if label in {"book_slot", "rag_query", "smalltalk"}:
                return label  # type: ignore[return-value]
        except Exception as err:  # noqa: BLE001
            logger.warning("Intent classifier fallback: %s", err)
        return "smalltalk"
