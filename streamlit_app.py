import warnings
warnings.filterwarnings("ignore")

import os
import sys
import asyncio
import logging
from pathlib import Path

# Silence ChromaDB internal telemetry & SSL warnings
logging.getLogger("chromadb.telemetry.product.posthog").disabled = True
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)
os.environ["ANONYMIZED_TELEMETRY"] = "False"

# Ensure backend module is accessible
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

import streamlit as st
from app.rag_pipeline import process_question

# -----------------------------------------------------------------------------
# Page Configuration
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="AI Research Assistant – Hybrid RAG System",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# Custom Styling (Replicating User Screenshot & Dark Theme)
# -----------------------------------------------------------------------------
st.markdown("""
<style>
    /* Dark app background */
    .stApp {
        background-color: #0e1117;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* Sidebar custom styling */
    [data-testid="stSidebar"] {
        background-color: #131722;
        border-right: 1px solid #242938;
        padding-top: 1rem;
    }
    
    [data-testid="stSidebar"] h3 {
        color: #ffffff;
        font-size: 1.15rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
    }

    /* Corpus green monospace box */
    .corpus-badge {
        display: inline-block;
        background-color: #0d2818;
        color: #4ade80;
        border: 1px solid #166534;
        padding: 3px 8px;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.82rem;
        word-break: break-all;
        margin-top: 2px;
        margin-bottom: 8px;
    }

    /* Sidebar overview list items */
    .overview-item {
        font-size: 0.92rem;
        color: #cbd5e1;
        margin-bottom: 0.6rem;
        line-height: 1.4;
    }

    /* Custom input box red/coral border */
    div[data-testid="stTextInput"] > div > div > input {
        background-color: #161b26 !important;
        border: 1px solid #e05252 !important;
        border-radius: 6px !important;
        color: #ffffff !important;
        font-size: 0.95rem !important;
        padding: 10px 14px !important;
    }
    div[data-testid="stTextInput"] > div > div > input:focus {
        border-color: #ff6b6b !important;
        box-shadow: 0 0 0 1px #ff6b6b !important;
    }

    /* Search & Answer Red Button */
    div.stButton > button[kind="primary"], .search-btn > div > button {
        background-color: #e04848 !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 0.5rem 1.25rem !important;
        transition: background-color 0.15s ease-in-out;
    }
    div.stButton > button[kind="primary"]:hover, .search-btn > div > button:hover {
        background-color: #c93b3b !important;
    }

    /* Secondary / Clear Chat Button */
    .clear-btn > div > button {
        background-color: #1e2433 !important;
        color: #cbd5e1 !important;
        border: 1px solid #334155 !important;
        border-radius: 6px !important;
        padding: 0.5rem 1.25rem !important;
    }
    .clear-btn > div > button:hover {
        background-color: #273043 !important;
        color: #ffffff !important;
    }

    /* Quick Assessment Question Buttons in Sidebar */
    [data-testid="stSidebar"] div.stButton > button {
        background-color: #1a202c !important;
        color: #e2e8f0 !important;
        border: 1px solid #334155 !important;
        border-radius: 6px !important;
        width: 100% !important;
        text-align: left !important;
        padding: 0.55rem 0.85rem !important;
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        margin-bottom: 0.4rem !important;
        transition: all 0.15s ease;
    }
    [data-testid="stSidebar"] div.stButton > button:hover {
        background-color: #2d3748 !important;
        border-color: #64748b !important;
        color: #ffffff !important;
    }

    /* Q&A Cards */
    .qa-card {
        background-color: #141824;
        border: 1px solid #262f45;
        border-radius: 8px;
        padding: 1.25rem;
        margin-top: 1.25rem;
        margin-bottom: 1.25rem;
    }
    .question-title {
        color: #93c5fd;
        font-size: 1.05rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
    }
    .answer-body {
        color: #f1f5f9;
        font-size: 0.95rem;
        line-height: 1.6;
    }
    .citations-container {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #262f45;
    }
    .citation-badge {
        display: inline-block;
        background-color: #1e293b;
        color: #38bdf8;
        border: 1px solid #334155;
        border-radius: 4px;
        padding: 3px 8px;
        font-size: 0.8rem;
        margin-right: 6px;
        margin-bottom: 6px;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Sidebar
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### 📖 System Overview")
    st.markdown(
        """
        <div class="overview-item">
            • <b>Corpus:</b><br>
            <div class="corpus-badge">transformer_rag_research_paper_50p.pdf</div>
        </div>
        <div class="overview-item">• <b>Pages:</b> 50 Pages</div>
        <div class="overview-item">• <b>Vector DB:</b> ChromaDB (Persistent)</div>
        <div class="overview-item">• <b>Embeddings:</b> all-MiniLM-L6-v2<br>&nbsp;&nbsp;&nbsp;(Local ONNX)</div>
        <div class="overview-item">• <b>Strict Grounding:</b> Enabled (<span style="color:#4ade80;font-family:monospace;">[not found]</span> fallback)</div>
        """,
        unsafe_allow_html=True
    )

    st.markdown("<hr style='border: none; border-top: 1px solid #242938; margin: 1.2rem 0;'>", unsafe_allow_html=True)
    st.markdown("### ⚡ Quick Assessment Questions")

    assessment_questions = [
        ("Q1: Training Hyperparameters", "What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?"),
        ("Q2: OpenAI CEO (Negative Test)", "Who is the current Chief Executive Officer of OpenAI?"),
        ("Q3: Hybrid Retrieval EM Gain", "By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?"),
        ("Q4: 13B Model GPU Configuration", "What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?"),
        ("Q5: Oppenheimer Box Office (Negative Test)", "What was the worldwide box-office revenue of the film Oppenheimer in 2023?")
    ]

    selected_quick_query = None
    for label, query_text in assessment_questions:
        if st.button(label, key=f"btn_{label}"):
            selected_quick_query = query_text

# -----------------------------------------------------------------------------
# Main Header
# -----------------------------------------------------------------------------
st.markdown("## 🔬 AI Research Assistant – Hybrid RAG System")
st.markdown("<p style='color: #94a3b8; font-style: italic; margin-top: -10px; margin-bottom: 25px;'>Interactive Q&A powered by ChromaDB Vector Database & Strictly Grounded Inference for ML Research Paper</p>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# State Management
# -----------------------------------------------------------------------------
if "messages" not in st.session_state:
    st.session_state.messages = []

if "input_value" not in st.session_state:
    st.session_state.input_value = ""

# Handle Quick Query selection
active_query = None
if selected_quick_query:
    active_query = selected_quick_query
    st.session_state.input_value = selected_quick_query

# -----------------------------------------------------------------------------
# Input & Action Controls
# -----------------------------------------------------------------------------
st.markdown("<p style='color: #e2e8f0; font-weight: 500; margin-bottom: 6px;'>Ask any technical question, architecture detail, hyperparameter, or benchmark result:</p>", unsafe_allow_html=True)

query_input = st.text_input(
    label="Search query",
    value=st.session_state.input_value,
    placeholder="e.g., What learning rate was used in Section 4?",
    label_visibility="collapsed"
)

col_search, col_clear, _ = st.columns([1.5, 1.2, 7])

with col_search:
    st.markdown('<div class="search-btn">', unsafe_allow_html=True)
    search_clicked = st.button("Search & Answer", type="primary", use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col_clear:
    st.markdown('<div class="clear-btn">', unsafe_allow_html=True)
    clear_clicked = st.button("Clear Chat", use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

if clear_clicked:
    st.session_state.messages = []
    st.session_state.input_value = ""
    st.rerun()

# Determine query to run
query_to_run = None
if search_clicked and query_input.strip():
    query_to_run = query_input.strip()
elif active_query:
    query_to_run = active_query

# -----------------------------------------------------------------------------
# Execute RAG Query
# -----------------------------------------------------------------------------
if query_to_run:
    with st.spinner("Retrieving hybrid contexts & generating verified response..."):
        # Terminal output as requested by user
        print(f"\n[STREAMLIT RAG] 🔍 QUESTION: {query_to_run}")
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            response = loop.run_until_complete(process_question(query_to_run))
            loop.close()

            print(f"[STREAMLIT RAG] 💡 ANSWER:\n{response.answer}")
            if response.citations:
                print(f"[STREAMLIT RAG] 📚 CITATIONS: {[(c.document, c.page, c.section) for c in response.citations]}")

            st.session_state.messages.insert(0, {
                "question": query_to_run,
                "answer": response.answer,
                "citations": response.citations,
                "source_type": response.source_type,
                "query_type": response.query_type
            })
        except Exception as e:
            st.error(f"Error executing query: {str(e)}")
            print(f"[STREAMLIT RAG] ❌ ERROR: {e}")

# -----------------------------------------------------------------------------
# Display Chat / Response History
# -----------------------------------------------------------------------------
if st.session_state.messages:
    for item in st.session_state.messages:
        with st.container():
            st.markdown(f"#### 🔍 {item['question']}")
            st.markdown(item["answer"])

            if item.get("citations"):
                with st.expander(f"📚 Verified Document Citations ({len(item['citations'])} sources)", expanded=True):
                    for idx, c in enumerate(item["citations"], 1):
                        st.markdown(
                            f"- **[{idx}]** Document: `{c.document}` | **Page: {c.page}** | Section: *{c.section}*"
                        )
            st.markdown("<hr style='border: none; border-top: 1px solid #1e2433; margin: 1.5rem 0;'>", unsafe_allow_html=True)
