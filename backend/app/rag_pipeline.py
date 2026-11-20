"""RAG pipeline – routes questions, retrieves context, generates answers."""

import logging
from google import genai

from app.config import GEMINI_API_KEY, LLM_MODEL, TOP_K_RETRIEVAL, TOP_K_RERANK
from app.hybrid_retriever import HybridRetriever
from app.reranker import rerank
from app.external_search import web_search
from app.schemas import ChatMessage, SourceCitation, ChatResponse
from app.vector_store import collection_count

logger = logging.getLogger(__name__)

_gemini_client: genai.Client | None = None

retriever = HybridRetriever()


def _get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Please add it to your .env file."
            )
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    return _gemini_client


def _call_llm(prompt: str) -> str:
    """Send prompt to Gemini and return the text response."""
    client = _get_gemini_client()
    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=prompt,
    )
    return response.text or ""


# ── Query classification ───────────────────────────────────

CLASSIFY_PROMPT = """You are a query classifier. Determine whether the following question should be answered using uploaded research paper documents or requires external/web knowledge.

Rules:
- Questions about model architecture, training configurations, optimization techniques, benchmark results, experimental findings, learning rates, GPU configurations, or anything that would be found in a research paper → respond with "document"
- Questions about current events, people's current roles, movie revenues, sports scores, general knowledge not in research papers → respond with "external"

Respond with ONLY one word: "document" or "external"

Question: {question}"""


def classify_query(question: str) -> str:
    """Classify whether the query needs document retrieval or external search."""
    try:
        result = _call_llm(CLASSIFY_PROMPT.format(question=question))
        classification = result.strip().lower()
        if "external" in classification:
            return "external"
        return "document"
    except Exception as e:
        logger.warning("Classification failed, defaulting to document: %s", e)
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
7. For numerical values, quote them exactly as they appear in the source.

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
    for msg in chat_history[-6:]:  # Keep last 6 messages for context
        lines.append(f"{msg.role.upper()}: {msg.content}")
    return "\n".join(lines)


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

    # 1. Hybrid retrieval
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

    # 2. Rerank
    reranked = rerank(question, raw_results, top_k=TOP_K_RERANK)

    # 3. Build context
    context = _format_context(reranked)
    history = _format_history(chat_history)

    # 4. Generate answer
    prompt = DOCUMENT_QA_PROMPT.format(
        context=context, history=history, question=question
    )
    answer = _call_llm(prompt)

    # 5. Build citations
    citations = []
    for r in reranked:
        meta = r.get("metadata", {})
        citations.append(
            SourceCitation(
                document=meta.get("document_name", "Unknown"),
                page=meta.get("page_number", 0),
                section=meta.get("section", "Unknown"),
                snippet=r["text"][:200] + ("..." if len(r["text"]) > 200 else ""),
                score=round(r.get("rerank_score", r.get("rrf_score", 0)), 4),
                source_type="document",
            )
        )

    return ChatResponse(
        answer=answer,
        citations=citations,
        source_type="document",
        query_type="document",
    )


# ── External knowledge QA ─────────────────────────────────

EXTERNAL_QA_PROMPT = """You are a knowledgeable assistant. Answer the following question using the provided web search results.

RULES:
1. Use the search results to provide an accurate, up-to-date answer.
2. Cite your sources with the URL.
3. If the search results don't contain enough information, say so and provide your best knowledge with a disclaimer.
4. NEVER pretend this information came from a research paper.
5. Use markdown formatting.

WEB SEARCH RESULTS:
{search_results}

QUESTION: {question}

Provide a clear answer with source citations."""


EXTERNAL_QA_NO_SEARCH_PROMPT = """You are a knowledgeable assistant. Answer the following general knowledge question.

RULES:
1. Provide an accurate answer based on your training knowledge.
2. Clearly state that this answer comes from general knowledge, not from any uploaded research paper.
3. If you're not confident about the accuracy of current/recent information, include a disclaimer.
4. Use markdown formatting.

QUESTION: {question}

Provide a clear answer, noting it is from general knowledge."""


async def answer_from_external(
    question: str,
    chat_history: list[ChatMessage],
) -> ChatResponse:
    """Answer using web search / general knowledge."""
    # Try web search first
    search_results = await web_search(question)

    citations = []

    if search_results:
        # Format search results
        formatted = "\n".join(
            f"[{i+1}] {r['title']}\n{r['snippet']}\nURL: {r['link']}"
            for i, r in enumerate(search_results)
        )
        prompt = EXTERNAL_QA_PROMPT.format(
            search_results=formatted, question=question
        )
        answer = _call_llm(prompt)

        for r in search_results[:3]:
            citations.append(
                SourceCitation(
                    document=r.get("title", "Web Source"),
                    page="N/A",
                    section="Web Search",
                    snippet=r.get("snippet", ""),
                    score=0.0,
                    source_type="web",
                )
            )
    else:
        # Fallback to LLM general knowledge
        prompt = EXTERNAL_QA_NO_SEARCH_PROMPT.format(question=question)
        answer = _call_llm(prompt)
        citations.append(
            SourceCitation(
                document="LLM General Knowledge",
                page="N/A",
                section="General Knowledge",
                snippet="Answer generated from the AI model's training data. Web search was unavailable.",
                score=0.0,
                source_type="web",
            )
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
    logger.info("Query classified as: %s", query_type)

    if query_type == "external":
        return await answer_from_external(question, chat_history)
    else:
        return await answer_from_documents(question, chat_history, document_ids)
