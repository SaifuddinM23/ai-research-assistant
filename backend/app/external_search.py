"""External knowledge search using Google Custom Search API and Gemini."""

import logging
import httpx

from app.config import GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID

logger = logging.getLogger(__name__)


async def web_search(query: str, num_results: int = 5) -> list[dict]:
    """Search the web using Google Custom Search JSON API.

    Returns list of {title, snippet, link}.
    Falls back gracefully if API key not configured.
    """
    if not GOOGLE_SEARCH_API_KEY or not GOOGLE_SEARCH_ENGINE_ID:
        logger.warning("Google Search API not configured – skipping web search.")
        return []

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_SEARCH_API_KEY,
        "cx": GOOGLE_SEARCH_ENGINE_ID,
        "q": query,
        "num": min(num_results, 10),
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for item in data.get("items", []):
            results.append(
                {
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "link": item.get("link", ""),
                }
            )
        return results

    except Exception as e:
        logger.error("Web search failed: %s", e)
        return []
