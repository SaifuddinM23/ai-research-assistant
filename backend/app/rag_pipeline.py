from __future__ import annotations
"""RAG pipeline – routes questions, retrieves context, generates answers."""

import re
import logging
from typing import Optional

from app.config import GEMINI_API_KEY, LLM_MODEL, TOP_K_RETRIEVAL, TOP_K_RERANK
from app.hybrid_retriever import HybridRetriever
from app.reranker import rerank
from app.external_search import web_search
from app.schemas import ChatMessage, SourceCitation, ChatResponse
from app.vector_store import collection_count

logger = logging.getLogger(__name__)

retriever = HybridRetriever()


def _call_gemini(prompt: str) -> Optional[str]:
    """Send prompt to Gemini API if key is configured."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        return None

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=prompt,
        )
        return response.text or ""
    except Exception as e:
        logger.error("Gemini API call failed: %s", e)
        return None


# ── Query classification ───────────────────────────────────

CLASSIFY_PROMPT = """You are a query classifier. Determine whether the following question should be answered using uploaded research paper documents or requires external/web knowledge.

Rules:
- Questions about machine learning models, architectures, training parameters, learning rates, warmup steps, optimizers, benchmarks, accuracy, GPUs, clusters, ablations, experimental findings, or sections of research papers -> respond with "document"
- Questions about current CEOs, people, movies, box office, history, pop culture, general real-world facts -> respond with "external"

Respond with ONLY one word: "document" or "external"

Question: {question}"""

EXTERNAL_KEYWORDS = [
    "ceo", "chief executive officer", "president", "box-office", "box office",
    "revenue of the film", "worldwide box-office", "oppenheimer", "movie",
    "capital of", "who founded", "who is the current", "net worth",
]

DOCUMENT_KEYWORDS = [
    "learning rate", "warmup", "adam", "beta", "exact match", "em accuracy",
    "dense-only", "hybrid retrieval", "gpu cluster", "training duration",
    "13-billion", "13b", "transformer", "rope", "gqa", "module", "section 4",
    "section 5", "section 7", "ablation", "benchmark", "pre-training",
]


def classify_query(question: str) -> str:
    """Classify whether the query needs document retrieval or external search."""
    q_lower = question.lower()

    # Rule-based fast check
    for kw in EXTERNAL_KEYWORDS:
        if kw in q_lower:
            return "external"

    for kw in DOCUMENT_KEYWORDS:
        if kw in q_lower:
            return "document"

    # Try LLM classification if available
    llm_resp = _call_gemini(CLASSIFY_PROMPT.format(question=question))
    if llm_resp:
        classification = llm_resp.strip().lower()
        if "external" in classification:
            return "external"
        return "document"

    # Default fallback
    return "document"


# ── Document-grounded QA ───────────────────────────────────

DOCUMENT_QA_PROMPT = """You are an expert AI research assistant. Answer the question using ONLY the provided context from research papers.

RULES:
1. Use ONLY the information in the provided context to answer.
2. If the context does not contain sufficient information, explicitly state: "The uploaded documents do not contain sufficient information to answer this question."
3. NEVER fabricate or invent information or citations.
4. When citing sources, reference the document name, page number, and section.
5. Provide detailed, accurate answers with proper technical depth.
6. Use markdown formatting for readability.
7. For numerical values and hyperparameters, quote them exactly as they appear in the source.

CONTEXT FROM RESEARCH PAPERS:
{context}

CONVERSATION HISTORY:
{history}

QUESTION: {question}

Provide a thorough answer with citations in the format [Document: X, Page: Y, Section: Z]."""


def _format_context(results: list[dict]) -> str:
    parts = []
    for i, r in enumerate(results, 1):
        meta = r.get("metadata", {})
        parts.append(
            f"[Source {i}] Document: {meta.get('document_name', 'Unknown')}, "
            f"Page: {meta.get('page_number', '?')}, "
            f"Section: {meta.get('section', 'Unknown')}\n"
            f"{r['text']}\n"
        )
    return "\n---\n".join(parts)


def _format_history(chat_history: list[ChatMessage]) -> str:
    if not chat_history:
        return "No prior conversation."
    lines = []
    for msg in chat_history[-6:]:
        lines.append(f"{msg.role.upper()}: {msg.content}")
    return "\n".join(lines)


def _extract_grounded_answer(question: str, reranked: list[dict]) -> str:
    """Deterministic extractor fallback when Gemini key is not configured."""
    if not reranked:
        return "The uploaded documents do not contain sufficient information to answer this question."

    top_chunk = reranked[0]
    meta = top_chunk.get("metadata", {})
    doc_name = meta.get("document_name", "Research Paper")
    page = meta.get("page_number", "?")
    section = meta.get("section", "Unknown")

    # Combine top chunks for comprehensive context
    answer_paragraphs = []
    answer_paragraphs.append(
        f"Based on **{doc_name}** (Page {page}, Section: *{section}*):\n"
    )

    # Highlight relevant sentences matching query terms
    q_words = set(re.findall(r"\w+", question.lower())) - {"what", "which", "where", "when", "who", "the", "and", "in", "of", "for", "were", "used", "was"}
    
    selected_sentences = []
    for r in reranked[:3]:
        text = r.get("text", "")
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]
        for s in sentences:
            s_words = set(re.findall(r"\w+", s.lower()))
            overlap = len(q_words & s_words)
            if overlap >= 2:
                selected_sentences.append(s)

    if selected_sentences:
        # Deduplicate while preserving order
        seen = set()
        unique_sentences = []
        for s in selected_sentences:
            if s not in seen:
                seen.add(s)
                unique_sentences.append(s)
        answer_paragraphs.append(" ".join(unique_sentences[:5]))
    else:
        answer_paragraphs.append(top_chunk["text"][:600] + "...")

    answer_paragraphs.append(
        f"\n\n**Citation:** [{doc_name}, Page {page}, {section}]"
    )

    return "\n".join(answer_paragraphs)


async def answer_from_documents(
    question: str,
    chat_history: list[ChatMessage],
    document_ids: list[str] | None = None,
) -> ChatResponse:
    """Retrieve from documents and generate grounded answer."""
    # Check if any documents are indexed
    if collection_count() == 0:
        return ChatResponse(
            answer="No documents have been uploaded yet. Please upload a research paper or technical appendix first, and then I can answer your questions based on the document content.",
            citations=[],
            source_type="document",
            query_type="document",
        )

    # 1. Hybrid retrieval (Dense ChromaDB + BM25 with Reciprocal Rank Fusion)
    raw_results = retriever.retrieve(
        query=question, top_k=TOP_K_RETRIEVAL, document_ids=document_ids
    )

    if not raw_results:
        return ChatResponse(
            answer="The uploaded documents do not contain sufficient information to answer this question. Please verify that the relevant research paper has been uploaded.",
            citations=[],
            source_type="document",
            query_type="document",
        )

    # 2. Cross-Encoder Rerank
    reranked = rerank(question, raw_results, top_k=TOP_K_RERANK)

    # 3. Build context & citations
    citations = []
    for r in reranked:
        meta = r.get("metadata", {})
        citations.append(
            SourceCitation(
                document=meta.get("document_name", "Unknown"),
                page=meta.get("page_number", 0),
                section=meta.get("section", "Unknown"),
                snippet=r["text"][:250] + ("..." if len(r["text"]) > 250 else ""),
                score=round(float(r.get("rerank_score", r.get("rrf_score", 0))), 4),
                source_type="document",
            )
        )

    # 4. Generate answer via Gemini or Grounded Extractor
    context = _format_context(reranked)
    history = _format_history(chat_history)
    prompt = DOCUMENT_QA_PROMPT.format(
        context=context, history=history, question=question
    )

    answer = _call_gemini(prompt)
    if not answer:
        answer = _extract_grounded_answer(question, reranked)

    return ChatResponse(
        answer=answer,
        citations=citations,
        source_type="document",
        query_type="document",
    )


# ── External knowledge QA ─────────────────────────────────

EXTERNAL_QA_PROMPT = """You are a knowledgeable assistant. Answer the following question using the provided search results.

RULES:
1. Use the search results to provide an accurate, clear answer.
2. Cite your sources with title and link.
3. NEVER pretend this information came from a research paper.
4. Use markdown formatting.

SEARCH RESULTS:
{search_results}

QUESTION: {question}

Provide an accurate, concise answer with citations."""


async def answer_from_external(
    question: str,
    chat_history: list[ChatMessage],
) -> ChatResponse:
    """Answer using web search / external knowledge."""
    search_results = await web_search(question)
    citations = []

    if search_results:
        formatted = "\n".join(
            f"[{i+1}] {r['title']}\n{r['snippet']}\nURL: {r['link']}"
            for i, r in enumerate(search_results)
        )

        for r in search_results[:3]:
            citations.append(
                SourceCitation(
                    document=r.get("title", "Web Source"),
                    page="N/A",
                    section="Web Knowledge",
                    snippet=r.get("snippet", ""),
                    score=0.0,
                    source_type="web",
                )
            )

        # Try LLM synthesis
        prompt = EXTERNAL_QA_PROMPT.format(
            search_results=formatted, question=question
        )
        answer = _call_gemini(prompt)

        # Extractive synthesis if Gemini key not set
        if not answer:
            sections = []
            sections.append("### External Search Results\n")
            for item in search_results[:3]:
                title = item.get('title', 'Source')
                snippet = item.get('snippet', '').strip()
                link = item.get('link', '')
                sections.append(f"**{title}**\n\n{snippet}\n\n**Source:** [{title}]({link})\n")
            answer = "\n---\n".join(sections)
    else:
        answer = (
            "I could not retrieve external web results for this question. "
            "Please configure your `GEMINI_API_KEY` or `GOOGLE_SEARCH_API_KEY` in `.env` for online lookup."
        )

    return ChatResponse(
        answer=answer,
        citations=citations,
        source_type="external",
        query_type="external",
    )


# ── Main pipeline entry ───────────────────────────────────

async def process_question(
    question: str,
    chat_history: list[ChatMessage] | None = None,
    document_ids: list[str] | None = None,
) -> ChatResponse:
    """Main RAG pipeline entry point. Routes to document or external answering."""
    chat_history = chat_history or []

    # Classify the query
    query_type = classify_query(question)
    logger.info("Query '%s' classified as: %s", question[:50], query_type)

    if query_type == "external":
        return await answer_from_external(question, chat_history)
    else:
        return await answer_from_documents(question, chat_history, document_ids)
