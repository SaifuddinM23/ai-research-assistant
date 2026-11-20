#!/usr/bin/env python3
import warnings
warnings.filterwarnings("ignore")

import os
import sys
import asyncio
import logging
from pathlib import Path

# Silence ChromaDB internal telemetry errors
logging.getLogger("chromadb.telemetry.product.posthog").disabled = True
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)
os.environ["ANONYMIZED_TELEMETRY"] = "False"

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

from app.rag_pipeline import process_question


async def run_query(question: str):
    print("\n" + "=" * 70)
    print(f"🔍 QUESTION: {question}")
    print("=" * 70)

    res = await process_question(question)

    print("\n💡 ANSWER:")
    print(res.answer)

    if res.citations:
        print("\n📚 CITATIONS:")
        for idx, c in enumerate(res.citations, 1):
            print(f"  [{idx}] {c.document} | Page: {c.page} | Section: {c.section}")
    print("\n" + "-" * 70)


async def main():
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
        await run_query(question)
    else:
        # Default assessment test suite
        questions = [
            "What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?",
            "Who is the current Chief Executive Officer of OpenAI?",
            "By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?",
            "What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?",
            "What was the worldwide box-office revenue of the film Oppenheimer in 2023?"
        ]
        for q in questions:
            await run_query(q)


if __name__ == "__main__":
    asyncio.run(main())
