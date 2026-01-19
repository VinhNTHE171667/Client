from app.schemas import ChatResponse


class ChatAgent:
    def __init__(self, greeting: str | None = None) -> None:
        self._greeting = greeting or (
            "Xin chào 🌸, rất vui được trò chuyện cùng bạn. Bạn muốn đặt lịch hay tìm hiểu dịch vụ ạ?"
        )

    def handle(self, query: str) -> ChatResponse:
        return ChatResponse(answer=self._greeting, intent="idle")
