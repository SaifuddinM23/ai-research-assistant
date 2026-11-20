"""FastAPI application – main entry point."""

import os
import uuid
import json
import logging
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import UPLOAD_DIR, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS, GEMINI_API_KEY
from app.schemas import (
    ChatRequest,
    ChatResponse,
    DocumentMeta,
    DocumentListResponse,
    HealthResponse,
)
from app.document_processor import (
    extract_text_from_pdf,
    chunk_pages,
    compute_file_hash,
)
from app.vector_store import add_chunks, delete_document_chunks, get_document_chunk_count, collection_count
from app.rag_pipeline import process_question

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Research Assistant",
    description="Hybrid RAG system for research paper Q&A",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory document registry ────────────────────────────
# Persisted as a JSON file alongside uploads.

REGISTRY_PATH = UPLOAD_DIR / "_registry.json"
_documents: dict[str, DocumentMeta] = {}
_file_hashes: dict[str, str] = {}  # hash -> doc_id


def _load_registry():
    global _documents, _file_hashes
    if REGISTRY_PATH.exists():
        data = json.loads(REGISTRY_PATH.read_text())
        for d in data:
            meta = DocumentMeta(**d)
            _documents[meta.id] = meta
        # rebuild hash index
        for doc_id, meta in _documents.items():
            pdf_path = UPLOAD_DIR / f"{doc_id}.pdf"
            if pdf_path.exists():
                h = compute_file_hash(pdf_path)
                _file_hashes[h] = doc_id


def _save_registry():
    data = [m.model_dump() for m in _documents.values()]
    REGISTRY_PATH.write_text(json.dumps(data, indent=2))


_load_registry()


# ── Endpoints ──────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health():
    chroma_ok = "ok"
    try:
        cnt = collection_count()
    except Exception:
        chroma_ok = "error"
        cnt = 0
    return HealthResponse(
        status="healthy",
        documents_count=len(_documents),
        chroma_status=chroma_ok,
        llm_configured=bool(GEMINI_API_KEY),
    )


@app.post("/api/documents/upload", response_model=DocumentMeta)
async def upload_document(file: UploadFile = File(...)):
    # Validate extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Only PDF files are allowed. Got: {ext}")

    # Read file bytes
    content = await file.read()
    size = len(content)

    if size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max size is {MAX_FILE_SIZE_MB}MB.")

    if size == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    # Save temporarily to compute hash
    doc_id = uuid.uuid4().hex[:12]
    pdf_path = UPLOAD_DIR / f"{doc_id}.pdf"
    pdf_path.write_bytes(content)

    file_hash = compute_file_hash(pdf_path)

    # Duplicate check
    if file_hash in _file_hashes:
        pdf_path.unlink(missing_ok=True)
        existing_id = _file_hashes[file_hash]
        existing = _documents.get(existing_id)
        if existing:
            raise HTTPException(
                409,
                f"This document has already been uploaded as '{existing.filename}'.",
            )

    # Extract and chunk
    try:
        pages = extract_text_from_pdf(pdf_path)
        chunks = chunk_pages(pages, doc_id, file.filename or "unknown.pdf")
    except Exception as e:
        pdf_path.unlink(missing_ok=True)
        logger.error("PDF processing failed: %s", e)
        raise HTTPException(500, f"Failed to process PDF: {str(e)}")

    # Embed and store
    try:
        count = add_chunks(chunks)
    except Exception as e:
        pdf_path.unlink(missing_ok=True)
        logger.error("Embedding/indexing failed: %s", e)
        raise HTTPException(500, f"Failed to index document: {str(e)}")

    meta = DocumentMeta(
        id=doc_id,
        filename=file.filename or "unknown.pdf",
        page_count=len(pages),
        chunk_count=count,
        upload_time=datetime.utcnow().isoformat(),
        size_bytes=size,
        status="indexed",
    )
    _documents[doc_id] = meta
    _file_hashes[file_hash] = doc_id
    _save_registry()

    logger.info("Document '%s' indexed: %d pages, %d chunks", meta.filename, meta.page_count, meta.chunk_count)
    return meta


@app.get("/api/documents", response_model=DocumentListResponse)
async def list_documents():
    return DocumentListResponse(documents=list(_documents.values()))


@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    if document_id not in _documents:
        raise HTTPException(404, "Document not found.")

    # Remove from ChromaDB
    deleted = delete_document_chunks(document_id)
    logger.info("Deleted %d chunks for document %s", deleted, document_id)

    # Remove PDF file
    pdf_path = UPLOAD_DIR / f"{document_id}.pdf"
    pdf_path.unlink(missing_ok=True)

    # Remove from registry
    # Remove hash entry
    for h, did in list(_file_hashes.items()):
        if did == document_id:
            del _file_hashes[h]
            break

    del _documents[document_id]
    _save_registry()

    return {"status": "deleted", "document_id": document_id, "chunks_deleted": deleted}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = await process_question(
            question=request.question,
            chat_history=request.chat_history,
            document_ids=request.document_ids if request.document_ids else None,
        )
        return response
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        logger.error("Chat error: %s", e, exc_info=True)
        raise HTTPException(500, f"An error occurred: {str(e)}")


# ── Run ────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    from app.config import BACKEND_HOST, BACKEND_PORT

    uvicorn.run("app.main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)
