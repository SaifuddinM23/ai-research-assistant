from __future__ import annotations
"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, Union, List


# ── Documents ──────────────────────────────────────────────

class DocumentMeta(BaseModel):
    id: str
    filename: str
    page_count: int
    chunk_count: int
    upload_time: str
    size_bytes: int
    status: str = "indexed"


class DocumentListResponse(BaseModel):
    documents: List[DocumentMeta]


# ── Chat ───────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    chat_history: List[ChatMessage] = Field(default_factory=list)
    document_ids: List[str] = Field(default_factory=list)


class SourceCitation(BaseModel):
    document: str
    page: Union[int, str]
    section: str
    snippet: str
    score: float = 0.0
    source_type: str = "document"  # "document" | "web"


class ChatResponse(BaseModel):
    answer: str
    citations: List[SourceCitation]
    source_type: str  # "document" | "external" | "mixed"
    query_type: str   # "document" | "external"


# ── Health ─────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    documents_count: int
    chroma_status: str
    llm_configured: bool
