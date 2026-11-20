"""End-to-end test script for the 5 assessment questions against the RAG system."""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.document_processor import extract_text_from_pdf, chunk_pages
from app.vector_store import add_chunks, collection_count
from app.rag_pipeline import process_question
from app.schemas import ChatMessage

PAPER_PATH = Path(__file__).resolve().parent.parent / "sample_papers" / "transformer_rag_research_paper_50p.pdf"


async def main():
    print("=" * 70)
    print("🧪 AI RESEARCH ASSISTANT – ASSESSMENT VERIFICATION SUITE")
    print("=" * 70)

    # 1. Ingest sample paper
    print(f"\n[Step 1] Ingesting reference paper: {PAPER_PATH.name}")
    assert PAPER_PATH.exists(), f"Paper not found at {PAPER_PATH}"

    pages = extract_text_from_pdf(PAPER_PATH)
    print(f"Extracted {len(pages)} pages.")

    doc_id = "sample_paper_eval"
    chunks = chunk_pages(pages, doc_id, PAPER_PATH.name)
    print(f"Generated {len(chunks)} text chunks.")

    added = add_chunks(chunks)
    print(f"Successfully embedded & indexed {added} chunks into ChromaDB.")
    print(f"Current collection chunk count: {collection_count()}")

    # 2. Run all 5 assessment questions
    questions = [
        (
            "Q1",
            "What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?",
            "document",
        ),
        (
            "Q2",
            "Who is the current Chief Executive Officer of OpenAI?",
            "external",
        ),
        (
            "Q3",
            "By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?",
            "document",
        ),
        (
            "Q4",
            "What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?",
            "document",
        ),
        (
            "Q5",
            "What was the worldwide box-office revenue of the film Oppenheimer in 2023?",
            "external",
        ),
    ]

    print("\n" + "=" * 70)
    print("📋 EVALUATING 5 ASSESSMENT QUESTIONS")
    print("=" * 70)

    for qid, question, expected_type in questions:
        print(f"\n--- [{qid}] Expected: {expected_type.upper()} ---")
        print(f"Question: {question}")
        res = await process_question(question, chat_history=[])

        print(f"Routed as: {res.query_type} (source_type={res.source_type})")
        print(f"Answer:\n{res.answer}")
        print("\nCitations:")
        for idx, c in enumerate(res.citations[:3], 1):
            print(f"  [{idx}] {c.document} | Page: {c.page} | Section: {c.section} (score: {c.score})")
            if c.snippet:
                print(f"      Snippet: {c.snippet[:120]}...")

    print("\n" + "=" * 70)
    print("✅ ASSESSMENT TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
