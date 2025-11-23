from typing import Literal

from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str
    session_id: str | None = None
    customer_id: str | None = None
    # Optional: pass a path to a single .txt file or directory of .txt files
    # to be used for a full-context query for this request only.
    full_context_path: str | None = None
    # Optional: pass a Gemini/Google API key for this request only.
    full_context_api_key: str | None = None


class ChatResponse(BaseModel):
    answer: str
    intent: Literal["info", "action", "idle"]
    metadata: dict | None = None
