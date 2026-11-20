"""External knowledge search using Google Custom Search API with Wikipedia fallback."""

import re
import html
import logging
import urllib.parse
import httpx

from app.config import GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID

logger = logging.getLogger(__name__)


def _clean_html(raw_html: str) -> str:
    """Remove HTML tags and unescape entities."""
    clean = re.sub(r"<[^>]+>", "", raw_html)
    return html.unescape(clean).strip()


async def search_google(query: str, num_results: int = 5) -> list[dict]:
    """Search using Google Custom Search API."""
    if not GOOGLE_SEARCH_API_KEY or not GOOGLE_SEARCH_ENGINE_ID:
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
        logger.warning("Google search failed: %s", e)
        return []


async def search_wikipedia(query: str, num_results: int = 4) -> list[dict]:
    """Fallback search using Wikipedia API."""
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json&utf8="
    headers = {"User-Agent": "ResearchAssistantBot/1.0 (academic research rag tool)"}

    try:
        async with httpx.AsyncClient(timeout=10, headers=headers) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        search_items = data.get("query", {}).get("search", [])
        results = []
        for item in search_items[:num_results]:
            title = item.get("title", "")
            snippet = _clean_html(item.get("snippet", ""))
            encoded_title = urllib.parse.quote(title.replace(" ", "_"))
            link = f"https://en.wikipedia.org/wiki/{encoded_title}"

            # Try to fetch intro paragraph for the top result
            intro = ""
            if len(results) == 0:
                try:
                    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded_title}"
                    s_resp = await client.get(summary_url, timeout=5)
                    if s_resp.status_code == 200:
                        s_data = s_resp.json()
                        extract = s_data.get("extract", "")
                        if extract:
                            intro = extract
                except Exception:
                    pass

            full_snippet = intro if intro else snippet
            results.append(
                {
                    "title": title,
                    "snippet": full_snippet,
                    "link": link,
                }
            )
        return results
    except Exception as e:
        logger.warning("Wikipedia fallback search failed: %s", e)
        return []


async def web_search(query: str, num_results: int = 5) -> list[dict]:
    """Unified search: Google Custom Search first, Wikipedia fallback."""
    # Try Google Custom Search
    results = await search_google(query, num_results)
    if results:
        return results

    # Fallback to Wikipedia
    logger.info("Using Wikipedia fallback search for query: %s", query)
    return await search_wikipedia(query, num_results)
