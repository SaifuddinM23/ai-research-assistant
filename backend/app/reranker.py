from __future__ import annotations
"""Cross-encoder reranker for improving retrieval relevance."""

import logging
from sentence_transformers import CrossEncoder

from app.config import CROSS_ENCODER_MODEL, TOP_K_RERANK

logger = logging.getLogger(__name__)

_model: CrossEncoder | None = None


def _get_model() -> CrossEncoder:
    global _model
    if _model is None:
        logger.info("Loading cross-encoder model: %s", CROSS_ENCODER_MODEL)
        _model = CrossEncoder(CROSS_ENCODER_MODEL)
        logger.info("Cross-encoder loaded.")
    return _model


def rerank(query: str, results: list[dict], top_k: int = TOP_K_RERANK) -> list[dict]:
    """Rerank results using a cross-encoder. Returns top_k reranked items."""
    if not results:
        return []

    try:
        model = _get_model()
        pairs = [(query, item["text"]) for item in results]
        scores = model.predict(pairs)

        for i, item in enumerate(results):
            item["rerank_score"] = float(scores[i])

        reranked = sorted(results, key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]

    except Exception as e:
        logger.warning("Reranker failed, returning unranked results: %s", e)
        return results[:top_k]
