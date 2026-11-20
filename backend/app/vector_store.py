from __future__ import annotations
"""ChromaDB vector store wrapper."""

import logging
import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import CHROMA_DIR
from app.document_processor import TextChunk
from app.embedding_service import embed_texts, embed_query

logger = logging.getLogger(__name__)

COLLECTION_NAME = "research_papers"

_client: chromadb.ClientAPI | None = None
_collection = None


def _get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = _get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(chunks: list[TextChunk]) -> int:
    """Embed and store chunks in ChromaDB. Returns count added."""
    if not chunks:
        return 0

    collection = get_collection()
    texts = [c.text for c in chunks]
    ids = [c.chunk_id for c in chunks]
    metadatas = [
        {
            "document_id": c.document_id,
            "document_name": c.document_name,
            "page_number": c.page_number,
            "section": c.section,
            "chunk_index": c.chunk_index,
        }
        for c in chunks
    ]

    # Batch embedding + upsert (ChromaDB max batch = 41666)
    batch_size = 256
    total = 0
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i : i + batch_size]
        batch_ids = ids[i : i + batch_size]
        batch_meta = metadatas[i : i + batch_size]
        embeddings = embed_texts(batch_texts)
        collection.upsert(
            ids=batch_ids,
            embeddings=embeddings,
            documents=batch_texts,
            metadatas=batch_meta,
        )
        total += len(batch_texts)
        logger.info("Indexed %d / %d chunks", total, len(texts))

    return total


def query_vectors(
    query: str,
    top_k: int = 10,
    document_ids: list[str] | None = None,
) -> list[dict]:
    """Dense vector search. Returns list of {id, text, metadata, score}."""
    collection = get_collection()
    if collection.count() == 0:
        return []

    query_emb = embed_query(query)

    where_filter = None
    if document_ids:
        if len(document_ids) == 1:
            where_filter = {"document_id": document_ids[0]}
        else:
            where_filter = {"document_id": {"$in": document_ids}}

    results = collection.query(
        query_embeddings=[query_emb],
        n_results=min(top_k, collection.count()),
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    hits: list[dict] = []
    if results and results["ids"] and results["ids"][0]:
        for idx in range(len(results["ids"][0])):
            # ChromaDB returns cosine distance; convert to similarity
            dist = results["distances"][0][idx]
            score = 1.0 - dist
            hits.append(
                {
                    "id": results["ids"][0][idx],
                    "text": results["documents"][0][idx],
                    "metadata": results["metadatas"][0][idx],
                    "score": score,
                }
            )
    return hits


def delete_document_chunks(document_id: str) -> int:
    """Delete all chunks belonging to a document. Returns deleted count."""
    collection = get_collection()
    # Fetch ids for this document
    all_data = collection.get(where={"document_id": document_id}, include=[])
    if all_data and all_data["ids"]:
        collection.delete(ids=all_data["ids"])
        return len(all_data["ids"])
    return 0


def get_document_chunk_count(document_id: str) -> int:
    collection = get_collection()
    result = collection.get(where={"document_id": document_id}, include=[])
    return len(result["ids"]) if result and result["ids"] else 0


def get_all_texts_for_documents(document_ids: list[str] | None = None) -> list[dict]:
    """Return all stored chunks (for BM25 index building)."""
    collection = get_collection()
    if collection.count() == 0:
        return []

    where_filter = None
    if document_ids:
        if len(document_ids) == 1:
            where_filter = {"document_id": document_ids[0]}
        else:
            where_filter = {"document_id": {"$in": document_ids}}

    results = collection.get(
        where=where_filter,
        include=["documents", "metadatas"],
    )

    items = []
    if results and results["ids"]:
        for idx in range(len(results["ids"])):
            items.append(
                {
                    "id": results["ids"][idx],
                    "text": results["documents"][idx],
                    "metadata": results["metadatas"][idx],
                }
            )
    return items


def collection_count() -> int:
    try:
        return get_collection().count()
    except Exception:
        return 0
