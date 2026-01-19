import json
import logging
import os
from typing import Iterable, List, Tuple

from pymilvus import Collection, CollectionSchema, DataType, FieldSchema, MilvusException, connections


class MilvusUnavailable(RuntimeError):
    """Raised when Milvus connection cannot be established."""


logger = logging.getLogger(__name__)


class MilvusVectorStore:
    """Thin wrapper around Milvus for storing and querying text embeddings."""

    def __init__(self,
                 collection_name: str | None = None,
                 host: str | None = None,
                 port: str | None = None,
                 embedding_dim: int | None = None) -> None:
        self.collection_name = collection_name or os.getenv("MILVUS_COLLECTION", "booking_text_embeddings")
        self.host = host or os.getenv("MILVUS_HOST", "localhost")
        self.port = port or os.getenv("MILVUS_PORT", "19530")
        self.embedding_dim = embedding_dim or int(os.getenv("EMBEDDING_DIM", "768"))
        self.alias = os.getenv("MILVUS_ALIAS", "default")
        try:
            self._connect()
            self.collection = self._get_or_create_collection()
        except MilvusException as err:  # noqa: BLE001
            raise MilvusUnavailable(str(err)) from err

    def _connect(self) -> None:
        alias = self.alias
        if alias in connections.list_connections():
            return
        connections.connect(alias=alias, host=self.host, port=self.port)
        logger.info("Connected to Milvus at %s:%s", self.host, self.port)

    def _get_or_create_collection(self) -> Collection:
        fields = [
            FieldSchema(name="doc_id", dtype=DataType.VARCHAR, is_primary=True, max_length=512),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.embedding_dim),
            FieldSchema(name="metadata", dtype=DataType.JSON, default={}),
        ]
        schema = CollectionSchema(fields=fields, description="Embeddings for booking knowledge base")
        try:
            Collection(name=self.collection_name, using=self.alias)
            logger.debug("Using existing Milvus collection %s", self.collection_name)
        except MilvusException:
            Collection(name=self.collection_name, schema=schema, using=self.alias)
            logger.info("Created Milvus collection %s", self.collection_name)
        collection = Collection(name=self.collection_name, using=self.alias)
        if not collection.has_index():
            collection.create_index(
                field_name="embedding",
                index_params={"metric_type": "IP", "index_type": "IVF_FLAT", "params": {"nlist": 1024}},
            )
            logger.info("Created default IVF_FLAT index for %s", self.collection_name)
        return collection

    def upsert_embeddings(self, vectors: Iterable[Tuple[str, List[float], dict]]) -> None:
        items = list(vectors)
        if not items:
            return
        doc_ids, embeddings, metadatas = zip(*items)
        payload = [list(doc_ids), list(embeddings), list(metadatas)]
        if not self.collection:
            raise MilvusUnavailable("Milvus collection not initialized")
        quoted = ", ".join(f'"{doc_id}"' for doc_id in doc_ids)
        if quoted:
            self.collection.delete(expr=f"doc_id in [{quoted}]")
        self.collection.insert(payload)
        self.collection.flush()
        logger.info("Upserted %d embedding vectors into %s", len(doc_ids), self.collection_name)

    def similarity_search(self, query: List[float], top_k: int = 5) -> List[dict]:
        if not self.collection:
            raise MilvusUnavailable("Milvus collection not initialized")
        self.collection.load()
        results = self.collection.search(
            data=[query],
            anns_field="embedding",
            params={"metric_type": "IP", "params": {"nprobe": 16}},
            limit=top_k,
            output_fields=["metadata"],
        )
        matches: List[dict] = []
        for hit in results[0]:
            metadata = hit.entity.get("metadata", {})
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except json.JSONDecodeError:
                    metadata = {"raw": metadata}
            if not isinstance(metadata, dict):
                metadata = {}
            metadata.setdefault("doc_id", hit.id)
            metadata.setdefault("source", metadata.get("doc_id"))
            metadata["score"] = float(getattr(hit, "score", 0.0))
            if hasattr(hit, "distance"):
                metadata["distance"] = float(getattr(hit, "distance"))
            matches.append(metadata)
        return matches
