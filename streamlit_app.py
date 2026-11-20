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
# Sleek Custom Styling (Matching User Screenshot & High-End Dark Palette)
# -----------------------------------------------------------------------------
st.markdown("""
<style>
    /* Remove default Streamlit top bar clutter */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 3rem !important;
        max-width: 1200px !important;
    }

    /* Dark app background */
    .stApp {
        background-color: #0b0d13;
        color: #e2e8f0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    }

    /* Sidebar custom styling */
    [data-testid="stSidebar"] {
        background-color: #10131d;
        border-right: 1px solid #1e2436;
        padding-top: 1.25rem;
    }
    
    [data-testid="stSidebar"] h3 {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.85rem;
        letter-spacing: -0.01em;
    }

    /* Corpus green monospace box */
    .corpus-badge {
        display: inline-block;
        background-color: #0b2214;
        color: #34d399;
        border: 1px solid #065f46;
        padding: 4px 9px;
        border-radius: 5px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.82rem;
        word-break: break-all;
        margin-top: 3px;
        margin-bottom: 10px;
    }

    /* Sidebar overview list items */
    .overview-item {
        font-size: 0.92rem;
        color: #94a3b8;
        margin-bottom: 0.65rem;
        line-height: 1.45;
    }
    .overview-item b {
        color: #e2e8f0;
    }

    /* Custom input box with refined red/coral border */
    div[data-testid="stTextInput"] > div > div > input {
        background-color: #121520 !important;
        border: 1.5px solid #e05252 !important;
        border-radius: 8px !important;
        color: #ffffff !important;
        font-size: 0.96rem !important;
        padding: 12px 16px !important;
        transition: all 0.2s ease-in-out;
    }
    div[data-testid="stTextInput"] > div > div > input:focus {
        border-color: #ff6b6b !important;
        box-shadow: 0 0 0 2px rgba(235, 87, 87, 0.25) !important;
        background-color: #141824 !important;
    }
    div[data-testid="stTextInput"] > div > div > input::placeholder {
        color: #64748b !important;
    }

    /* Search & Answer Red Button */
    div.stButton > button[kind="primary"], .search-btn > div > button {
        background: linear-gradient(135deg, #eb5757 0%, #c93b3b 100%) !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        font-size: 0.92rem !important;
        border: none !important;
        border-radius: 7px !important;
        padding: 0.6rem 1.4rem !important;
        box-shadow: 0 2px 6px rgba(235, 87, 87, 0.25) !important;
        transition: all 0.15s ease-in-out;
    }
    div.stButton > button[kind="primary"]:hover, .search-btn > div > button:hover {
        background: linear-gradient(135deg, #f06a6a 0%, #db4242 100%) !important;
        box-shadow: 0 3px 10px rgba(235, 87, 87, 0.4) !important;
    }

    /* Secondary / Clear Chat Button */
    .clear-btn > div > button {
        background-color: #171b28 !important;
        color: #94a3b8 !important;
        border: 1px solid #273145 !important;
        border-radius: 7px !important;
        font-weight: 500 !important;
        font-size: 0.92rem !important;
        padding: 0.6rem 1.4rem !important;
        transition: all 0.15s ease-in-out;
    }
    .clear-btn > div > button:hover {
        background-color: #20273a !important;
        color: #f1f5f9 !important;
        border-color: #3b4863 !important;
    }

    /* Quick Assessment Question Buttons in Sidebar */
    [data-testid="stSidebar"] div.stButton > button {
        background-color: #151926 !important;
        color: #cbd5e1 !important;
        border: 1px solid #242c3f !important;
        border-radius: 6px !important;
        width: 100% !important;
        text-align: left !important;
        padding: 0.6rem 0.9rem !important;
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        margin-bottom: 0.45rem !important;
        transition: all 0.15s ease;
    }
    [data-testid="stSidebar"] div.stButton > button:hover {
        background-color: #222a3d !important;
        border-color: #43516f !important;
        color: #ffffff !important;
    }

    /* Result Cards */
    .response-card {
        background-color: #121622;
        border: 1px solid #1e2638;
        border-radius: 10px;
        padding: 1.4rem 1.5rem;
        margin-top: 1.25rem;
        margin-bottom: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .response-card h4 {
        color: #60a5fa;
        font-size: 1.05rem;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 0.85rem;
    }

    /* [not found] notification box */
    .not-found-box {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.95rem;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: 6px;
        margin-top: 0.25rem;
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
        <div class="overview-item">• <b>Embeddings:</b> <span style="color:#34d399;font-family:monospace;">all-MiniLM-L6-v2</span><br>&nbsp;&nbsp;&nbsp;(Local ONNX)</div>
        <div class="overview-item">• <b>Strict Grounding:</b> Enabled (<span style="color:#34d399;font-family:monospace;">[not found]</span> fallback)</div>
        """,
        unsafe_allow_html=True
    )

    st.markdown("<hr style='border: none; border-top: 1px solid #1e2436; margin: 1.2rem 0;'>", unsafe_allow_html=True)
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
st.markdown("""
<div style="margin-bottom: 1.5rem;">
    <h2 style="color: #6366f1; font-size: 1.85rem; font-weight: 700; margin: 0 0 0.4rem 0; display: flex; align-items: center; gap: 0.6rem;">
        🔬 AI Research Assistant – Hybrid RAG System
    </h2>
    <p style="color: #94a3b8; font-style: italic; font-size: 0.95rem; margin: 0;">
        Interactive Q&A powered by ChromaDB Vector Database & Strictly Grounded Inference for ML Research Paper
    </p>
</div>
""", unsafe_allow_html=True)

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
st.markdown("<p style='color: #cbd5e1; font-weight: 500; font-size: 0.95rem; margin-bottom: 6px;'>Ask any technical question, architecture detail, hyperparameter, or benchmark result:</p>", unsafe_allow_html=True)

query_input = st.text_input(
    label="Search query",
    value=st.session_state.input_value,
    placeholder="e.g., What learning rate was used in Section 4?",
    label_visibility="collapsed"
)

col_search, col_clear, _ = st.columns([1.6, 1.3, 7])

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
            st.markdown(f"""
            <div class="response-card">
                <h4>🔍 {item['question']}</h4>
            </div>
            """, unsafe_allow_html=True)

            if item["answer"] == "[not found]":
                st.markdown(
                    """
                    <div class="not-found-box">
                        <span>⚠️ [not found]</span>
                        <span style="font-size:0.85rem;color:#f87171;font-weight:400;">— Question is external or absent from the uploaded PDF</span>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            else:
                st.markdown(item["answer"])

            if item.get("citations"):
                with st.expander(f"📚 Verified Document Citations ({len(item['citations'])} sources)", expanded=True):
                    for idx, c in enumerate(item["citations"], 1):
                        st.markdown(
                            f"- **[{idx}]** Document: `{c.document}` | **Page: {c.page}** | Section: *{c.section}*"
                        )
            st.markdown("<hr style='border: none; border-top: 1px solid #1a2133; margin: 1.5rem 0;'>", unsafe_allow_html=True)
