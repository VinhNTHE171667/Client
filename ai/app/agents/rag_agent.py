import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.model_provider import get_chat_model, get_embeddings
from app.schemas import ChatResponse
from app.vector.milvus_client import MilvusUnavailable, MilvusVectorStore

logger = logging.getLogger(__name__)


class KnowledgeAgent:
    def __init__(self) -> None:
        self._vector_store: MilvusVectorStore | None = None
        self._ensure_vector_store()

    def _ensure_vector_store(self) -> MilvusVectorStore | None:
        if self._vector_store is not None:
            return self._vector_store
        try:
            self._vector_store = MilvusVectorStore()
        except MilvusUnavailable as err:
            logger.warning("Milvus unavailable: fallback to info responses without RAG (%s)", err)
            self._vector_store = None
        return self._vector_store

    def handle(self, query: str) -> ChatResponse:
        embedding = get_embeddings().embed_query(query)
        store = self._ensure_vector_store()
        if not store:
            context = "Nguồn tri thức tạm thời không khả dụng."
            matches = []
        else:
            try:
                matches = store.similarity_search(embedding, top_k=4)
            except MilvusUnavailable as err:
                logger.warning("Milvus query failed, fallback to info response (%s)", err)
                self._vector_store = None
                context = "Nguồn tri thức tạm thời không khả dụng."
                matches = []
            else:
                context = "\n\n".join(match.get("chunk", "") for match in matches if match.get("chunk"))
                if not context:
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
        system_prompt = "Bạn là trợ lý đặt lịch cung cấp thông tin từ tài liệu nội bộ."
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Ngữ cảnh:\n{context}\n\nCâu hỏi:\n{query}"),
        ]
        answer = get_chat_model().invoke(messages).content
        return ChatResponse(answer=answer, intent="info", metadata={"source_count": len(matches)})
