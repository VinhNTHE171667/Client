import hashlib
import json
import logging
import os
import re
import unicodedata
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:  # Fallback for older LangChain versions
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore[import-not-found]
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.vector.milvus_client import MilvusUnavailable, MilvusVectorStore


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STATE_PATH = BASE_DIR / "vector" / "ingest_state.json"


def load_state() -> Dict[str, str]:
    if STATE_PATH.exists():
        with STATE_PATH.open("r", encoding="utf-8") as fp:
            return json.load(fp)
    return {}


def save_state(state: Dict[str, str]) -> None:
    # ensure parent directory exists
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with STATE_PATH.open("w", encoding="utf-8") as fp:
        json.dump(state, fp, indent=2)


def compute_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def read_documents() -> List[tuple[str, str]]:
    documents: List[tuple[str, str]] = []
    for path in sorted(DATA_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        documents.append((path.stem, text))
    return documents


def _extract_service_name(text: str) -> str | None:
    match = re.search(r"^\*+\s*Tên dịch vụ:\s*(.+)$", text, flags=re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None


def _extract_effect(text: str) -> str | None:
    match = re.search(r"^\*+\s*Hiệu quả:\s*(.+)$", text, flags=re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None


def _normalize_token(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value or "")
    stripped = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return stripped.lower().strip()


def _extract_durations(text: str) -> List[int]:
    durations: set[int] = set()
    lowered = text.lower()
    for match in re.findall(r"(\d{1,3})\s*(?:phút|phut|p)\b", lowered):
        try:
            durations.add(int(match))
        except ValueError:
            continue
    for match in re.findall(r"(\d{1,2})\s*(?:giờ|gio)\b", lowered):
        try:
            durations.add(int(match) * 60)
        except ValueError:
            continue
    return sorted(durations)


def _convert_price(raw_value: str, suffix: str | None) -> int | None:
    digits = re.sub(r"[^0-9]", "", raw_value or "")
    if not digits:
        return None
    value = int(digits)
    if not suffix:
        return value
    normalized_suffix = _normalize_token(suffix)
    if normalized_suffix in {"k", "ngan", "nghin"}:
        return value * 1000
    if normalized_suffix in {"tr", "trieu"}:
        return value * 1_000_000
    if normalized_suffix in {"trieu dong", "trieu vnd"}:
        return value * 1_000_000
    return value


def _extract_price_range(text: str) -> tuple[int | None, int | None]:
    prices: List[int] = []
    pattern = re.compile(
        r"(\d[\d.,]*)\s*(k|ngan|ngàn|nghin|nghìn|tr|trieu|triệu|vnđ|vnd|đ|dong|đồng)\b",
        flags=re.IGNORECASE,
    )
    for raw_value, suffix in pattern.findall(text):
        price = _convert_price(raw_value, suffix)
        if price and price >= 10000:
            prices.append(price)
    if not prices:
        return None, None
    return min(prices), max(prices)

def _normalize_model_name(name: str) -> str:
    if not name:
        return name
    if name.startswith("models/"):
        return name
    return f"models/{name}"


def embed_and_upsert() -> None:
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is required for embedding generation")

    embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    normalized_model = _normalize_model_name(embedding_model)
    embeddings = GoogleGenerativeAIEmbeddings(model=normalized_model, google_api_key=api_key)
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    try:
        store = MilvusVectorStore()
        collection_entities = store.collection.num_entities if getattr(store, "collection", None) else 0
    except MilvusUnavailable as err:
        logger.error("Không thể kết nối Milvus: %s", err)
        logger.error("Bỏ qua bước ingest. Vui lòng khởi động Milvus và chạy lại script.")
        return

    state = load_state()
    if collection_entities == 0 and state:
        logger.warning(
            "Milvus collection trống nhưng ingest_state còn dữ liệu. Bật lại full ingest cho tất cả tài liệu."
        )
        state = {}

    updated_state: Dict[str, str] = state.copy()
    processed = 0

    for doc_id, text in read_documents():
        digest = compute_hash(text)
        if state.get(doc_id) == digest:
            logger.info("Skipping %s, no changes detected", doc_id)
            continue
        chunks = splitter.split_text(text)
        vectors = embeddings.embed_documents(chunks)
        service_name = _extract_service_name(text)
        effect = _extract_effect(text)
        durations = _extract_durations(text)
        price_min, price_max = _extract_price_range(text)
        base_metadata = {
            "doc_id": doc_id,
            "source": f"{doc_id}.txt",
            "service_name": service_name or doc_id,
            "effect": effect,
            "durations": durations,
            "price_min": price_min,
            "price_max": price_max,
        }
        payload = []
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            # include explicit text/page_content fields so retrieval returns actual text
            metadata = {
                **base_metadata,
                "chunk": chunk,
                "text": chunk,
                "page_content": chunk,
                "chunk_index": idx,
                "section": "body",
            }
            payload.append((f"{doc_id}_{idx}", vector, metadata))

        # Add document-level summary chunk to capture global facts (e.g., tổng số dịch vụ).
        numeric_lines = [line for line in text.splitlines() if re.match(r"^\s*\d+\.\s", line)]
        service_count = len(numeric_lines)
        summary_chunk = (
            f"Tài liệu {doc_id} mô tả tổng cộng {service_count} dịch vụ spa và chăm sóc cơ thể cùng mô tả chi tiết."
            if service_count
            else f"Tài liệu {doc_id} tóm tắt thông tin dịch vụ spa và chăm sóc cơ thể."
        )
        summary_vector = embeddings.embed_query(summary_chunk)
        payload.append(
            (
                f"{doc_id}_summary",
                summary_vector,
                {
                    **base_metadata,
                    "chunk": summary_chunk,
                    "section": "summary",
                    "service_count": service_count,
                    "chunk_index": -1,
                },
            )
        )
        store.upsert_embeddings(payload)
        updated_state[doc_id] = digest
        processed += 1
        logger.info("Ingested %s (%d chunks)", doc_id, len(chunks))

    save_state(updated_state)
    logger.info("Ingestion completed. %d documents processed", processed)


if __name__ == "__main__":
    embed_and_upsert()
