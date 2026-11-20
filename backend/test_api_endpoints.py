"""Test all FastAPI endpoints in backend/app/main.py."""

import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.main import app

client = TestClient(app)
PAPER_PATH = Path(__file__).resolve().parent.parent / "sample_papers" / "transformer_rag_research_paper_50p.pdf"


def test_api():
    print("Testing GET /api/health...")
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health failed: {resp.text}"
    print("Health:", resp.json())

    print("\nTesting GET /api/documents (empty)...")
    resp = client.get("/api/documents")
    assert resp.status_code == 200
    print("Docs count:", len(resp.json()["documents"]))

    print(f"\nTesting POST /api/documents/upload with {PAPER_PATH.name}...")
    with open(PAPER_PATH, "rb") as f:
        files = {"file": (PAPER_PATH.name, f, "application/pdf")}
        resp = client.post("/api/documents/upload", files=files)
    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    uploaded = resp.json()
    print("Uploaded document:", uploaded["filename"], "chunks:", uploaded["chunk_count"])
    doc_id = uploaded["id"]

    print("\nTesting duplicate upload rejection (409)...")
    with open(PAPER_PATH, "rb") as f:
        files = {"file": (PAPER_PATH.name, f, "application/pdf")}
        resp = client.post("/api/documents/upload", files=files)
    assert resp.status_code == 409, f"Duplicate check failed: {resp.status_code}"
    print("Duplicate correctly rejected with 409 Conflict.")

    print("\nTesting POST /api/chat (Q1 - Document)...")
    payload = {
        "question": "What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?",
        "chat_history": [],
        "document_ids": [doc_id],
    }
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200, f"Chat failed: {resp.text}"
    chat_res = resp.json()
    print("Query type:", chat_res["query_type"])
    print("Citations count:", len(chat_res["citations"]))
    print("First citation:", chat_res["citations"][0]["document"], "Page:", chat_res["citations"][0]["page"], "Section:", chat_res["citations"][0]["section"])

    print("\nTesting POST /api/chat (Q2 - External)...")
    payload = {
        "question": "Who is the current Chief Executive Officer of OpenAI?",
        "chat_history": [],
        "document_ids": [doc_id],
    }
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200, f"Chat external failed: {resp.text}"
    ext_res = resp.json()
    print("Query type:", ext_res["query_type"])
    print("Source type:", ext_res["source_type"])

    print("\nTesting DELETE /api/documents/{id}...")
    resp = client.delete(f"/api/documents/{doc_id}")
    assert resp.status_code == 200
    print("Deleted document:", resp.json())

    # Re-upload so the document remains available for the user
    with open(PAPER_PATH, "rb") as f:
        files = {"file": (PAPER_PATH.name, f, "application/pdf")}
        resp = client.post("/api/documents/upload", files=files)
    print("Re-uploaded document for live usage:", resp.json()["id"])

    print("\nALL API ENDPOINTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_api()
