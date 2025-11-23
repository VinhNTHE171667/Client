import logging
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agents.booking_agent import BookingAgent
from app.agents.chat_agent import ChatAgent
from app.agents.intent_classifier import IntentClassifier
from app.agents.rag_agent import KnowledgeAgent
from app.schemas import ChatRequest, ChatResponse
from app.rag_ingest import embed_and_upsert
from app.vector.milvus_client import MilvusUnavailable, MilvusVectorStore
from app.utils.full_context import FullContextManager

import pymysql
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
# from dataanalyze.rfm_analysis import run_rfm_clustering
# from dataanalyze.combo_analysis import run_apriori_analysis
# from dataanalyze.churn_analysis import run_churn_prediction


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

BOOKING_ENTRY_PROMPT = (
    "Bạn đã chọn tôi là chatbot đặt lịch. Bạn hãy cung cấp thông tin theo thứ tự để được hỗ trợ đặt lịch nhé. "
    "Nhập 'bắt đầu' để tiến hành!"
)
RAG_ENTRY_PROMPT = (
    "Chào bạn 👋 Tôi là trợ lý thông tin của spa. Tôi có thể giúp bạn tìm hiểu về dịch vụ, giá, khuyến mãi "
    "hoặc quy trình spa. Bạn muốn biết về chủ đề nào?"
)
SMALLTALK_ENTRY_PROMPT = (
    "Xin chào 🌸, rất vui được trò chuyện cùng bạn. Bạn muốn đặt lịch hay tìm hiểu dịch vụ ạ?"
)


class SessionManager:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    def get(self, session_id: str) -> Optional[str]:
        return self._store.get(session_id)

    def set(self, session_id: str, intent: str) -> None:
        self._store[session_id] = intent

    def clear(self, session_id: str) -> None:
        self._store.pop(session_id, None)


intent_classifier = IntentClassifier()
booking_agent = BookingAgent()
knowledge_agent = KnowledgeAgent()
chat_agent = ChatAgent(SMALLTALK_ENTRY_PROMPT)
sessions = SessionManager()

# Full-context manager: load full docs from app/data/full_docs (or pass custom path via env)
FULL_DOCS_DIR = os.getenv("FULL_CONTEXT_DOCS", os.path.join(os.path.dirname(__file__), "data", "full_docs"))
full_ctx = FullContextManager(docs_dir=FULL_DOCS_DIR, api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI(title="do_an_fa25 Booking Chatbot", version="0.2.0")

# CORS: cho phép frontend local truy cập API
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5174",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_knowledge_base() -> None:
    try:
        store = MilvusVectorStore()
    except MilvusUnavailable as err:
        logger.warning("Không thể kết nối Milvus khi khởi động: %s", err)
        return

    entity_count = store.collection.num_entities if getattr(store, "collection", None) else 0
    if entity_count > 0:
        logger.info("Milvus đã có sẵn %d vectors cho RAG.", entity_count)
        return

    logger.info("Milvus trống. Tiến hành ingest dữ liệu từ app/data khi khởi động.")
    try:
        embed_and_upsert()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Ingest knowledge base thất bại khi khởi động: %s", exc)


def _fetch_rfm_data():
    DB_CONFIG = {
        "host": os.getenv("MYSQL_HOST", "host.docker.internal"),
        "port": int(os.getenv("MYSQL_PORT", 3306)),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", "root"),
        "database": os.getenv("MYSQL_DB", "gen_spa"),
        "charset": "utf8mb4",
    }
    conn = pymysql.connect(**DB_CONFIG)
    query = """
    SELECT
        c.id AS customer_id,
        c.full_name,
        DATEDIFF(NOW(), MAX(a.appointment_date)) AS recency,
        COUNT(a.id) AS frequency,
        c.total_spent AS monetary
    FROM
        customer c
    JOIN
        appointment a ON c.id = a.customerId
    WHERE
        a.status IN ('completed', 'paid')
    GROUP BY
        c.id, c.full_name, c.total_spent
    HAVING
        monetary > 0;
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df


def _run_rfm_clustering():
    """Chạy phân tích RFM clustering"""
    # return run_rfm_clustering()
    return {"status": "disabled", "message": "RFM analysis temporarily disabled"}


def _run_combo_analysis():
    """Chạy phân tích Apriori combo"""
    # return run_apriori_analysis(min_support=0.05, min_confidence=0.3)
    return {"status": "disabled", "message": "Combo analysis temporarily disabled"}


def _activate_booking(session_id: str, query: str = "") -> ChatResponse:
    query_lower = query.lower().strip()

    # Nếu người dùng nói "không đặt lịch" hoặc tương tự, hỏi lại thay vì vào flow đặt lịch
    if any(phrase in query_lower for phrase in ["không đặt lịch", "khong dat lich", "không muốn đặt", "khong muon dat"]):
        return ChatResponse(
            answer="Bạn muốn đặt lịch hay tìm hiểu dịch vụ? Vui lòng nhập 'đặt lịch' hoặc 'tìm hiểu dịch vụ'.",
            intent="idle"
        )

    sessions.set(session_id, "book_slot")
    booking_agent.reset_session(session_id)
    
    # Nếu người dùng đã nói "bắt đầu" ngay từ đầu (hoặc khi session bị mất),
    # chúng ta chuyển thẳng vào xử lý thay vì hiện prompt chào mừng.
    if query_lower in ["bắt đầu", "bat dau", "start", "begin", "ok"]:
        return booking_agent.handle(session_id, query)
        
    return ChatResponse(answer=BOOKING_ENTRY_PROMPT, intent="idle")


def _activate_rag(session_id: str) -> ChatResponse:
    sessions.set(session_id, "rag_query")
    return ChatResponse(answer=RAG_ENTRY_PROMPT, intent="idle")


def _handle_new_session(session_id: str, predicted_intent: str, query: str) -> ChatResponse:
    if predicted_intent == "book_slot":
        return _activate_booking(session_id, query)
    if predicted_intent == "rag_query":
        return _activate_rag(session_id)
    sessions.clear(session_id)
    booking_agent.reset_session(session_id)
    return chat_agent.handle(query)


def _switch_intent(session_id: str, predicted_intent: str, query: str) -> ChatResponse:
    if predicted_intent == "book_slot":
        return _activate_booking(session_id, query)
    if predicted_intent == "rag_query":
        return _activate_rag(session_id)
    sessions.clear(session_id)
    booking_agent.reset_session(session_id)
    return chat_agent.handle(query)


def _has_meaningful_answer(answer: Optional[str]) -> bool:
    if not answer:
        return False
    stripped = answer.strip()
    if not stripped:
        return False
    lowered = stripped.lower()
    bland_markers = (
        "không tìm thấy",
        "không có thông tin",
        "chưa có thông tin",
        "no relevant",
        "not found",
        "no information",
    )
    return not any(marker in lowered for marker in bland_markers)


def _full_context_answer(query: str, override_path: Optional[str], override_key: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    if override_path or override_key:
        try:
            mgr = FullContextManager(docs_dir=override_path, api_key=override_key)
            if mgr.is_enabled():
                answer = mgr.get_answer(query)
                if answer:
                    return answer, "full_context_request"
        except Exception as exc:  # noqa: BLE001
            logger.warning("FullContext override error: %s", exc)
    try:
        if "full_ctx" in globals() and full_ctx and full_ctx.is_enabled():
            answer = full_ctx.get_answer(query)
            if answer:
                return answer, "full_context_global"
    except Exception as exc:  # noqa: BLE001
        logger.warning("FullContext global error: %s", exc)
    return None, None


def _answer_full_context_then_rag(
    query: str,
    session_id: str,
    override_path: Optional[str],
    override_key: Optional[str],
) -> Optional[ChatResponse]:
    fc_answer, fc_source = _full_context_answer(query, override_path, override_key)
    if fc_answer:
        sessions.set(session_id, "rag_query")
        metadata = {"source": fc_source} if fc_source else None
        return ChatResponse(answer=fc_answer, intent="info", metadata=metadata)

    rag_response: Optional[ChatResponse] = None
    try:
        rag_response = knowledge_agent.handle(query)
    except Exception as exc:  # noqa: BLE001
        logger.warning("KnowledgeAgent error: %s", exc)

    if rag_response and _has_meaningful_answer(rag_response.answer):
        sessions.set(session_id, "rag_query")
        return rag_response

    if rag_response:
        sessions.set(session_id, "rag_query")
        return rag_response

    return None


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    query = (request.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    session_id = request.session_id or "default"
    
    # Set customer_id vào booking session nếu có trong request
    if request.customer_id:
        logger.info(f"Setting customer_id={request.customer_id} for session={session_id}")
        booking_agent.set_customer_id(session_id, request.customer_id)
    else:
        logger.warning(f"No customer_id in request for session={session_id}")
    
    active_intent = sessions.get(session_id)
    predicted_intent = intent_classifier.predict(query)

    override_path = getattr(request, "full_context_path", None)
    override_key = getattr(request, "full_context_api_key", None)

    if predicted_intent == "rag_query" and active_intent != "book_slot":
        rag_result = _answer_full_context_then_rag(query, session_id, override_path, override_key)
        if rag_result:
            return rag_result

    if not active_intent:
        return _handle_new_session(session_id, predicted_intent, query)

    if predicted_intent != active_intent and predicted_intent != "smalltalk" and active_intent != "book_slot":
        return _switch_intent(session_id, predicted_intent, query)

    if active_intent == "book_slot":
        response = booking_agent.handle(session_id, query)
        if response.metadata and response.metadata.get("appointment_id"):
            sessions.clear(session_id)
            booking_agent.reset_session(session_id)
        return response

    if active_intent == "rag_query":
        rag_result = _answer_full_context_then_rag(query, session_id, override_path, override_key)
        if rag_result:
            return rag_result
        return ChatResponse(answer="Xin lỗi, tôi không tìm thấy thông tin phù hợp.", intent="info")

    sessions.clear(session_id)
    booking_agent.reset_session(session_id)
    return chat_agent.handle(query)


@app.delete("/chat/session/{session_id}")
def clear_session(session_id: str) -> dict[str, str]:
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    sessions.clear(session_id)
    booking_agent.reset_session(session_id)
    logger.info("Cleared chatbot session %s", session_id)
    return {"status": "cleared"}


@app.get("/rfm-clusters")
def get_rfm_clusters() -> list[dict]:
    """Endpoint để lấy dữ liệu RFM clusters cho Dashboard"""
    try:
        result = _run_rfm_clustering()
        return result
    except Exception as exc:
        logger.exception("RFM clustering failed: %s", exc)
        raise HTTPException(status_code=500, detail="RFM analysis failed")


@app.get("/combo-recommendations")
def get_combo_recommendations() -> dict:
    """Endpoint để lấy gợi ý combo cho Dashboard"""
    try:
        result = _run_combo_analysis()
        return result
    except Exception as exc:
        logger.exception("Combo analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail="Combo analysis failed")


@app.get("/churn-prediction")
def get_churn_prediction() -> list[dict]:
    """Endpoint để lấy dự đoán churn cho Dashboard"""
    try:
        # result = run_churn_prediction()
        result = {"status": "disabled", "message": "Churn prediction temporarily disabled"}
        return result
    except Exception as exc:
        logger.exception("Churn prediction failed: %s", exc)
        raise HTTPException(status_code=500, detail="Churn prediction failed")


@app.on_event("startup")
def bootstrap_knowledge_base() -> None:
    _ensure_knowledge_base()


# Register recommendation adapter (if present). This mounts endpoints under /api/recommendation
try:
    from app.recommendation_adapter import register_recommendation_routes
    register_recommendation_routes(app)
except Exception as exc:
    logger.exception("Recommendation adapter not available or failed to register: %s", exc)
