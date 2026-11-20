from __future__ import annotations
"""Hybrid retriever: dense + BM25 with Reciprocal Rank Fusion."""

from app.vector_store import query_vectors
from app.bm25_retriever import BM25Retriever
from app.config import TOP_K_RETRIEVAL, RRF_K


def reciprocal_rank_fusion(
    result_lists: list[list[dict]], k: int = RRF_K
) -> list[dict]:
    """Merge multiple ranked lists using RRF.

    Each item dict must have an "id" key. Returns merged list sorted by RRF score.
    """
    fused_scores: dict[str, float] = {}
    item_map: dict[str, dict] = {}

    for results in result_lists:
        for rank, item in enumerate(results):
            item_id = item["id"]
            fused_scores[item_id] = fused_scores.get(item_id, 0.0) + 1.0 / (k + rank + 1)
            if item_id not in item_map:
                item_map[item_id] = item

    # Sort by fused score descending
    sorted_ids = sorted(fused_scores, key=fused_scores.get, reverse=True)
    merged = []
    for item_id in sorted_ids:
        entry = item_map[item_id].copy()
        entry["rrf_score"] = fused_scores[item_id]
        merged.append(entry)
    return merged


class HybridRetriever:
    def __init__(self):
        self.bm25 = BM25Retriever()

    def retrieve(
        self,
        query: str,
        top_k: int = TOP_K_RETRIEVAL,
        document_ids: list[str] | None = None,
    ) -> list[dict]:
        """Run dense + BM25, fuse with RRF, return top-k merged results."""
        # 1. Dense retrieval from ChromaDB
        dense_results = query_vectors(query, top_k=top_k, document_ids=document_ids)

        # 2. Sparse BM25 retrieval
        self.bm25.build_index(document_ids)
        bm25_results = self.bm25.search(query, top_k=top_k)

        # 3. Reciprocal Rank Fusion
        fused = reciprocal_rank_fusion([dense_results, bm25_results])

        return fused[:top_k]
