"""BM25 sparse retriever."""

import re
from rank_bm25 import BM25Okapi
from app.vector_store import get_all_texts_for_documents


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + lowercased tokenizer with minimal cleanup."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\.\-]", " ", text)
    tokens = text.split()
    return [t for t in tokens if len(t) > 1]


class BM25Retriever:
    def __init__(self):
        self._index: BM25Okapi | None = None
        self._corpus: list[dict] = []

    def build_index(self, document_ids: list[str] | None = None):
        """Build/rebuild the BM25 index from ChromaDB stored chunks."""
        self._corpus = get_all_texts_for_documents(document_ids)
        if not self._corpus:
            self._index = None
            return
        tokenized = [_tokenize(item["text"]) for item in self._corpus]
        self._index = BM25Okapi(tokenized)

    def search(self, query: str, top_k: int = 10) -> list[dict]:
        """Return top-k BM25 results as [{id, text, metadata, score}]."""
        if self._index is None or not self._corpus:
            return []

        query_tokens = _tokenize(query)
        scores = self._index.get_scores(query_tokens)

        # Pair scores with corpus items
        scored = list(zip(scores, self._corpus))
        scored.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, item in scored[:top_k]:
            if score <= 0:
                continue
            results.append(
                {
                    "id": item["id"],
                    "text": item["text"],
                    "metadata": item["metadata"],
                    "score": float(score),
                }
            )
        return results
