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
    page_title="NexusRAG | AI Research Intelligence",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# Modern Cyber-Obsidian & Glassmorphism Styling
# -----------------------------------------------------------------------------
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    #MainMenu, footer, header {visibility: hidden;}
    
    .block-container {
        padding-top: 1.5rem !important;
        padding-bottom: 3rem !important;
        max-width: 1260px !important;
    }

    /* Base Theme */
    .stApp {
        background: radial-gradient(circle at 15% 15%, #111827 0%, #07090e 100%);
        color: #f3f4f6;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    }

    /* Sidebar Glassmorphism */
    [data-testid="stSidebar"] {
        background-color: rgba(10, 14, 23, 0.95);
        backdrop-filter: blur(20px);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 1.25rem;
    }

    /* Pulsing Status Dot */
    .pulse-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #10b981;
        box-shadow: 0 0 10px #10b981;
        margin-right: 8px;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Stat Cards */
    .stat-card {
        background: rgba(17, 24, 39, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .stat-card:hover {
        border-color: rgba(99, 102, 241, 0.5);
        transform: translateY(-2px);
    }
    .stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #9ca3af;
        font-weight: 600;
        margin-bottom: 4px;
    }
    .stat-value {
        font-size: 1.15rem;
        font-weight: 700;
        color: #ffffff;
        font-family: 'JetBrains Mono', monospace;
    }

    /* Hero Search Bar */
    div[data-testid="stTextInput"] > div > div > input {
        background: rgba(17, 24, 39, 0.8) !important;
        border: 1.5px solid #4f46e5 !important;
        border-radius: 12px !important;
        color: #ffffff !important;
        font-size: 1rem !important;
        padding: 14px 18px !important;
        box-shadow: 0 4px 20px -2px rgba(79, 70, 229, 0.25) !important;
        transition: all 0.2s ease;
    }
    div[data-testid="stTextInput"] > div > div > input:focus {
        border-color: #818cf8 !important;
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.35) !important;
    }

    /* Gradient Primary Button */
    div.stButton > button[kind="primary"], .action-btn > div > button {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 0.65rem 1.6rem !important;
        box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4) !important;
        transition: all 0.2s ease;
    }
    div.stButton > button[kind="primary"]:hover, .action-btn > div > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px 0 rgba(124, 58, 237, 0.5) !important;
    }

    /* Secondary Clear Button */
    .clear-btn > div > button {
        background: rgba(31, 41, 55, 0.5) !important;
        color: #9ca3af !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 10px !important;
        font-size: 0.95rem !important;
        padding: 0.65rem 1.4rem !important;
    }
    .clear-btn > div > button:hover {
        background: rgba(55, 65, 81, 0.8) !important;
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
    }

    /* Sidebar Preset Buttons */
    [data-testid="stSidebar"] div.stButton > button {
        background: rgba(17, 24, 39, 0.6) !important;
        color: #cbd5e1 !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 8px !important;
        width: 100% !important;
        text-align: left !important;
        padding: 0.65rem 0.9rem !important;
        font-size: 0.86rem !important;
        font-weight: 500 !important;
        margin-bottom: 0.4rem !important;
        transition: all 0.15s ease;
    }
    [data-testid="stSidebar"] div.stButton > button:hover {
        background: rgba(79, 70, 229, 0.2) !important;
        border-color: #6366f1 !important;
        color: #ffffff !important;
    }

    /* Answer Cards */
    .answer-card {
        background: rgba(17, 24, 39, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-left: 4px solid #6366f1;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 1.25rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .answer-card.notfound {
        border-left-color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
    }

    /* Citation Tags */
    .cite-pill {
        display: inline-flex;
        align-items: center;
        background: rgba(99, 102, 241, 0.12);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 0.78rem;
        font-family: 'JetBrains Mono', monospace;
        margin-right: 6px;
        margin-bottom: 6px;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Sidebar: System Monitor & Quick Presets
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("""
    <div style="display:flex; align-items:center; margin-bottom: 1.25rem;">
        <span class="pulse-dot"></span>
        <span style="font-weight:700; font-size:1.1rem; color:#ffffff; letter-spacing:-0.01em;">HYBRID RAG SYSTEM</span>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:12px; margin-bottom:1.5rem;">
        <div style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; font-weight:600; margin-bottom:6px;">Indexed Corpus</div>
        <div style="color:#34d399; font-family:'JetBrains Mono',monospace; font-size:0.8rem; word-break:break-all;">transformer_rag_research_paper_50p.pdf</div>
        <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:0.82rem; color:#cbd5e1;">
            <span>Coverage: <b>50 Pages</b></span>
            <span>Chunks: <b>50 Dense</b></span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<p style='font-weight:600; font-size:0.9rem; color:#e2e8f0; margin-bottom:8px;'>⚡ Assessment Queries</p>", unsafe_allow_html=True)

    assessment_presets = [
        ("📌 Q1: Pre-training Hyperparameters", "What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?"),
        ("🛡️ Q2: OpenAI CEO (Negative Test)", "Who is the current Chief Executive Officer of OpenAI?"),
        ("📊 Q3: Hybrid Retrieval EM Gain", "By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?"),
        ("⚡ Q4: 13B Model GPU Configuration", "What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?"),
        ("🛡️ Q5: Oppenheimer Box Office (Negative)", "What was the worldwide box-office revenue of the film Oppenheimer in 2023?")
    ]

    selected_query_preset = None
    for label, q_text in assessment_presets:
        if st.button(label, key=f"btn_{label}"):
            selected_query_preset = q_text

    st.markdown("<hr style='border:none; border-top:1px solid rgba(255,255,255,0.08); margin:1.5rem 0;'>", unsafe_allow_html=True)
    st.markdown("""
    <div style="font-size:0.78rem; color:#6b7280; line-height:1.4;">
        Dense: <b>all-MiniLM-L6-v2 (384d)</b><br>
        Sparse: <b>BM25 Okapi</b><br>
        Fusion: <b>RRF (k=60) + Cross-Encoder</b><br>
        Guardrail: <b>Strict Grounding [not found]</b>
    </div>
    """, unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Main Header & Top Executive Metric Ribbon
# -----------------------------------------------------------------------------
st.markdown("""
<div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1.5rem;">
    <div>
        <h1 style="font-size:2.2rem; font-weight:800; margin:0; background: linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            NexusRAG Research Engine
        </h1>
        <p style="color:#94a3b8; font-size:0.95rem; margin-top:4px; margin-bottom:0;">
            Context-Grounded Inference & Benchmarks over 50-Page ML Monograph
        </p>
    </div>
    <div style="text-align:right;">
        <span style="background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.3); padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:600;">
            ChromaDB Persistent • ONNX Ready
        </span>
    </div>
</div>
""", unsafe_allow_html=True)

# Metrics Ribbon
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">Document Ingestion</div>
        <div class="stat-value" style="color:#34d399;">50 / 50 Pages</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">Retrieval Pipeline</div>
        <div class="stat-value" style="color:#818cf8;">Hybrid (Dense+BM25)</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">Rerank Engine</div>
        <div class="stat-value" style="color:#c084fc;">Cross-Encoder</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">Hallucination Guard</div>
        <div class="stat-value" style="color:#f87171;">Strict [not found]</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='margin-bottom: 1.75rem;'></div>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Tabs Interface
# -----------------------------------------------------------------------------
tab_chat, tab_benchmarks = st.tabs(["💬 Interactive Research Query", "📊 Ground Truth Knowledge Cards"])

# -----------------------------------------------------------------------------
# State Management
# -----------------------------------------------------------------------------
if "messages" not in st.session_state:
    st.session_state.messages = []

if "input_query" not in st.session_state:
    st.session_state.input_query = ""

if selected_query_preset:
    st.session_state.input_query = selected_query_preset

# -----------------------------------------------------------------------------
# TAB 1: Chat / Query
# -----------------------------------------------------------------------------
with tab_chat:
    query_text = st.text_input(
        label="Ask anything about the 50-page research paper",
        value=st.session_state.input_query,
        placeholder="Ask about training hyperparameters, model architecture, H100 GPU clusters, or benchmarks...",
        label_visibility="collapsed"
    )

    c_search, c_clear, _ = st.columns([1.6, 1.2, 7])
    with c_search:
        st.markdown('<div class="action-btn">', unsafe_allow_html=True)
        btn_search = st.button("⚡ Run RAG Search", type="primary", use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with c_clear:
        st.markdown('<div class="clear-btn">', unsafe_allow_html=True)
        btn_clear = st.button("Clear History", use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    if btn_clear:
        st.session_state.messages = []
        st.session_state.input_query = ""
        st.rerun()

    # Trigger search if button clicked or preset chosen
    query_to_execute = None
    if btn_search and query_text.strip():
        query_to_execute = query_text.strip()
    elif selected_query_preset:
        query_to_execute = selected_query_preset

    if query_to_execute:
        with st.spinner("Executing dense vector + BM25 fusion & cross-encoder verification..."):
            print(f"\n[STREAMLIT RAG] 🔍 QUESTION: {query_to_execute}")
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                res = loop.run_until_complete(process_question(query_to_execute))
                loop.close()

                print(f"[STREAMLIT RAG] 💡 ANSWER:\n{res.answer}")
                if res.citations:
                    print(f"[STREAMLIT RAG] 📚 CITATIONS: {[(c.document, c.page, c.section) for c in res.citations]}")

                st.session_state.messages.insert(0, {
                    "question": query_to_execute,
                    "answer": res.answer,
                    "citations": res.citations,
                    "source_type": res.source_type,
                    "query_type": res.query_type
                })
            except Exception as e:
                st.error(f"Execution Error: {e}")
                print(f"[STREAMLIT RAG] ❌ ERROR: {e}")

    # Display History
    if st.session_state.messages:
        for idx, entry in enumerate(st.session_state.messages):
            is_nf = (entry["answer"].strip() == "[not found]")
            card_class = "answer-card notfound" if is_nf else "answer-card"

            st.markdown(f"""
            <div class="{card_class}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="font-weight:700; font-size:1.05rem; color:#ffffff;">🔍 {entry['question']}</span>
                    <span style="font-size:0.75rem; color:#9ca3af; font-family:'JetBrains Mono',monospace;">Query #{len(st.session_state.messages) - idx}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

            if is_nf:
                st.markdown("""
                <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:12px 16px; margin: 8px 0 16px 0; color:#fca5a5; font-family:'JetBrains Mono',monospace; font-weight:600; display:inline-block;">
                    ⚠️ [not found] &nbsp;<span style="font-weight:400; color:#f87171; font-size:0.85rem;">— Unverifiable in uploaded research paper context</span>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(entry["answer"])

            if entry.get("citations"):
                with st.expander(f"📚 Verified Document Citations ({len(entry['citations'])} sources)", expanded=True):
                    for c_idx, c in enumerate(entry["citations"], 1):
                        st.markdown(f"- **[{c_idx}]** Document: `{c.document}` | **Page: {c.page}** | Section: *{c.section}*")

            st.markdown("<hr style='border:none; border-top:1px solid rgba(255,255,255,0.06); margin:1.5rem 0;'>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# TAB 2: Quick Knowledge Cards (Exploration Mode)
# -----------------------------------------------------------------------------
with tab_benchmarks:
    st.markdown("### 📑 Verified Findings from `transformer_rag_research_paper_50p.pdf`")
    b_col1, b_col2, b_col3 = st.columns(3)

    with b_col1:
        st.markdown("""
        <div style="background:rgba(17,24,39,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem;">
            <div style="font-size:0.8rem; text-transform:uppercase; color:#818cf8; font-weight:700;">Section 4.2 • Page 16</div>
            <h4 style="margin:6px 0 12px 0; color:#ffffff;">Pre-training Hyperparameters</h4>
            <ul style="font-size:0.88rem; color:#cbd5e1; padding-left:1.2rem; line-height:1.6;">
                <li><b>Optimizer:</b> AdamW (β₁=0.9, β₂=0.95)</li>
                <li><b>Peak Learning Rate:</b> 3 × 10⁻⁴ (0.0003)</li>
                <li><b>Warmup Steps:</b> 4,000 steps</li>
                <li><b>Weight Decay:</b> 0.1, Grad Clip: 1.0</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

    with b_col2:
        st.markdown("""
        <div style="background:rgba(17,24,39,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem;">
            <div style="font-size:0.8rem; text-transform:uppercase; color:#34d399; font-weight:700;">Section 5.3 • Page 31</div>
            <h4 style="margin:6px 0 12px 0; color:#ffffff;">Hybrid Retrieval Benchmark</h4>
            <ul style="font-size:0.88rem; color:#cbd5e1; padding-left:1.2rem; line-height:1.6;">
                <li><b>Dense-Only Baseline:</b> 61.2% EM</li>
                <li><b>Hybrid (Dense + BM25):</b> 75.8% EM</li>
                <li><b>Net Improvement:</b> <b>+14.6%</b> absolute gain</li>
                <li><b>Reranker:</b> Cross-Encoder top-5</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

    with b_col3:
        st.markdown("""
        <div style="background:rgba(17,24,39,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem;">
            <div style="font-size:0.8rem; text-transform:uppercase; color:#f472b6; font-weight:700;">Section 7.1 • Page 45</div>
            <h4 style="margin:6px 0 12px 0; color:#ffffff;">13B Parameter Training Cluster</h4>
            <ul style="font-size:0.88rem; color:#cbd5e1; padding-left:1.2rem; line-height:1.6;">
                <li><b>Compute Cluster:</b> 128 NVIDIA H100 (80GB SXM5)</li>
                <li><b>Interconnect:</b> 400 Gbps InfiniBand</li>
                <li><b>Duration:</b> 18.5 continuous days</li>
                <li><b>Token Volume:</b> 2.4 Trillion tokens</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
