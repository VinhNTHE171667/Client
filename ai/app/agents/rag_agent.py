import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.model_provider import get_chat_model, get_embeddings
from app.schemas import ChatResponse
from app.vector.milvus_client import MilvusUnavailable, MilvusVectorStore
from app.utils.full_context import FullContextManager

logger = logging.getLogger(__name__)


class KnowledgeAgent:
    def __init__(self) -> None:
        self._vector_store: MilvusVectorStore | None = None
        self._full_context: FullContextManager | None = None
        self._ensure_vector_store()
        self._ensure_full_context()

    def _ensure_vector_store(self) -> MilvusVectorStore | None:
        if self._vector_store is not None:
            return self._vector_store
        try:
            self._vector_store = MilvusVectorStore()
        except MilvusUnavailable as err:
            logger.warning("Milvus unavailable: fallback to info responses without RAG (%s)", err)
            self._vector_store = None
        return self._vector_store

    def _ensure_full_context(self) -> FullContextManager | None:
        if self._full_context is not None:
            return self._full_context
        try:
            self._full_context = FullContextManager()
        except Exception as err:
            logger.warning("FullContext initialization failed: %s", err)
            self._full_context = None
        return self._full_context

    def handle(self, query: str) -> ChatResponse:
        embedding = get_embeddings().embed_query(query)
        store = self._ensure_vector_store()
        use_full_context_fallback = False
        
        if not store:
            context = "Nguồn tri thức tạm thời không khả dụng."
            matches = []
            use_full_context_fallback = True
        else:
            try:
                matches = store.similarity_search(embedding, top_k=4)
            except MilvusUnavailable as err:
                logger.warning("Milvus query failed, fallback to info response (%s)", err)
                self._vector_store = None
                context = "Nguồn tri thức tạm thời không khả dụng."
                matches = []
                use_full_context_fallback = True
            else:
                context = "\n\n".join(match.get("chunk", "") for match in matches if match.get("chunk"))
                if not context:
                    logger.info("RAG: No relevant chunks found, will try FullContext fallback")
                    use_full_context_fallback = True
                    context = "Không tìm thấy tài liệu liên quan."
                service_counts = {
                    int(match["service_count"])
                    for match in matches
                    if isinstance(match.get("service_count"), int)
                }
                if service_counts:
                    total_services = max(service_counts)
                    summary_line = (
                        f"Tổng hợp tài liệu: Bộ dữ liệu mô tả tổng cộng {total_services} dịch vụ spa và chăm sóc cơ thể."
                    )
                    context = f"{summary_line}\n\n{context}" if context else summary_line
        
        # Try FullContext fallback if RAG didn't find good results
        if use_full_context_fallback:
            full_ctx = self._ensure_full_context()
            if full_ctx and full_ctx.is_enabled():
                logger.info("Using FullContext fallback for query: %s", query[:50])
                full_answer = full_ctx.get_answer(query)
                if full_answer:
                    return ChatResponse(answer=full_answer, intent="info", metadata={"source": "full_context"})
                else:
                    logger.warning("FullContext fallback returned no answer")
        
        # Normal RAG path with LLM
        system_prompt = "Bạn là trợ lý đặt lịch cung cấp thông tin từ tài liệu nội bộ."
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Ngữ cảnh:\n{context}\n\nCâu hỏi:\n{query}"),
        ]
        answer = get_chat_model().invoke(messages).content
        return ChatResponse(answer=answer, intent="info", metadata={"source_count": len(matches)})
