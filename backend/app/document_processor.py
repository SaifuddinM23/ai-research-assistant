from __future__ import annotations
"""PDF document processing – extraction, chunking, metadata."""

import re
import hashlib
from pathlib import Path
from dataclasses import dataclass, field

import fitz  # PyMuPDF

from app.config import CHUNK_SIZE, CHUNK_OVERLAP


@dataclass
class TextChunk:
    text: str
    document_id: str
    document_name: str
    page_number: int
    section: str
    chunk_index: int
    metadata: dict = field(default_factory=dict)

    @property
    def chunk_id(self) -> str:
        raw = f"{self.document_id}_{self.page_number}_{self.chunk_index}"
        return hashlib.md5(raw.encode()).hexdigest()


# ── Section heading detector ────────────────────────────────

_SECTION_RE = re.compile(
    r"^(?:SECTION\s+\d+(?:\.\d+)*[:\s].*|CHAPTER\s+\d+.*|MODULE\s+\d+(?:\.\d+)*[:\s].*)",
    re.IGNORECASE,
)

_HEADING_RE = re.compile(
    r"^(?:"
    r"(?:Abstract|Introduction|Related Work|Background|Method(?:ology|s)?|"
    r"Approach|Architecture|Model|Experiment(?:s|al)?|Results?|"
    r"Discussion|Conclusion(?:s)?|Acknowledgement(?:s)?|References|"
    r"Appendix(?:\s+[A-Z])?|Training|Evaluation|Setup|"
    r"Pre[\-\s]?training|Fine[\-\s]?tuning|Ablation|Analysis|"
    r"Implementation|Dataset(?:s)?|Benchmark(?:s)?|Limitations|"
    r"Ethics|Broader Impact|Hyperparameter(?:s)?|Optimization)"
    r"(?:\s|$|:|\.))",
    re.IGNORECASE,
)

_NUMBERED_HEADING_RE = re.compile(
    r"^(\d{1,2}(?:\.\d{1,2}){0,3})\s+([A-Z].*)",
)


def _detect_section(line: str) -> str | None:
    line = line.strip()
    if not line:
        return None
    if _SECTION_RE.match(line):
        return line[:100]
    m = _NUMBERED_HEADING_RE.match(line)
    if m:
        return line[:100]
    # General heading: must be short (< 60 chars and < 8 words)
    words = line.split()
    if len(words) <= 7 and len(line) < 60 and _HEADING_RE.match(line):
        return line[:100]
    return None


# ── PDF text extraction ─────────────────────────────────────

def extract_text_from_pdf(pdf_path: str | Path) -> list[dict]:
    """Return list of {page_number, text, sections}."""
    doc = fitz.open(str(pdf_path))
    pages: list[dict] = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text")
        pages.append({"page_number": page_num, "text": text})
    doc.close()
    return pages


# ── Chunking ────────────────────────────────────────────────

def chunk_pages(
    pages: list[dict],
    document_id: str,
    document_name: str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[TextChunk]:
    """Split extracted pages into overlapping text chunks."""
    chunks: list[TextChunk] = []
    chunk_index = 0
    current_section = "Unknown"

    for page in pages:
        lines = page["text"].split("\n")
        page_num = page["page_number"]

        # Build cleaned text with section tracking
        page_text = ""
        for line in lines:
            sec = _detect_section(line)
            if sec:
                current_section = sec
            page_text += line + "\n"

        page_text = page_text.strip()
        if not page_text:
            continue

        # Word-level sliding window
        words = page_text.split()
        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk_words = words[start:end]
            text = " ".join(chunk_words)

            if len(text.strip()) < 20:
                break

            chunk = TextChunk(
                text=text,
                document_id=document_id,
                document_name=document_name,
                page_number=page_num,
                section=current_section,
                chunk_index=chunk_index,
            )
            chunks.append(chunk)
            chunk_index += 1

            if end >= len(words):
                break
            start = end - chunk_overlap

    return chunks


def compute_file_hash(file_path: str | Path) -> str:
    """SHA-256 hash for duplicate detection."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(1 << 16), b""):
            h.update(block)
    return h.hexdigest()
