from functools import lru_cache
import os

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")


def _normalize_model_name(name: str) -> str:
    if not name:
        return name
    if name.startswith("models/"):
        return name
    return f"models/{name}"


@lru_cache(maxsize=1)
def get_chat_model() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable is not set")
    model_name = _normalize_model_name(DEFAULT_GEMINI_MODEL)
    return ChatGoogleGenerativeAI(model=model_name, temperature=0.2, google_api_key=api_key)


@lru_cache(maxsize=1)
def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable is not set")
    model_name = _normalize_model_name(DEFAULT_EMBEDDING_MODEL)
    return GoogleGenerativeAIEmbeddings(model=model_name, google_api_key=api_key)
