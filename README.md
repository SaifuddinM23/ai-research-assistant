# 🔬 AI Research Assistant – Hybrid RAG System

An intelligent research assistant that accepts machine learning research papers and technical appendices, enabling users to ask questions and receive accurate, context-grounded answers with citations.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────────┐
│   React + Vite  │────▶│  FastAPI Backend                             │
│   Tailwind CSS  │◀────│                                              │
│                 │     │  ┌──────────────┐   ┌────────────────────┐   │
│  • Chat UI      │     │  │  PDF Upload   │──▶│ Document Processor │   │
│  • Doc Upload   │     │  │  /api/upload  │   │  (PyMuPDF)         │   │
│  • Citations    │     │  └──────────────┘   └────────┬───────────┘   │
│  • Markdown     │     │                              │               │
│                 │     │                    ┌──────────▼───────────┐   │
└─────────────────┘     │                    │ Sentence Transformers│   │
                        │                    │  Embedding Service   │   │
                        │                    └──────────┬───────────┘   │
                        │                              │               │
                        │  ┌──────────────┐  ┌─────────▼───────────┐   │
                        │  │   BM25        │  │     ChromaDB        │   │
                        │  │  (Sparse)     │  │   (Dense Vector)    │   │
                        │  └──────┬───────┘  └─────────┬───────────┘   │
                        │         │                    │               │
                        │         └────────┬───────────┘               │
                        │                  ▼                           │
                        │      ┌───────────────────┐                   │
                        │      │  Reciprocal Rank   │                  │
                        │      │  Fusion (RRF)      │                  │
                        │      └─────────┬─────────┘                   │
                        │                ▼                             │
                        │      ┌───────────────────┐                   │
                        │      │  Cross-Encoder     │                  │
                        │      │  Reranker          │                  │
                        │      └─────────┬─────────┘                   │
                        │                ▼                             │
                        │      ┌───────────────────┐                   │
                        │      │  Query Classifier  │──▶ External?     │
                        │      └─────────┬─────────┘    │              │
                        │                ▼              ▼              │
                        │      ┌──────────────┐  ┌──────────────┐     │
                        │      │  Gemini LLM   │  │  Web Search  │     │
                        │      │  (Document QA)│  │  (External)  │     │
                        │      └──────────────┘  └──────────────┘     │
                        └──────────────────────────────────────────────┘
```

## ✨ Features

- **PDF Document Processing**: Upload research papers, extract text with section headings and page numbers
- **Hybrid Retrieval**: Dense vector search (ChromaDB) + BM25 keyword matching
- **Reciprocal Rank Fusion**: Combines dense and sparse retrieval results
- **Cross-Encoder Reranking**: Improves relevance of retrieved chunks
- **Grounded Answers**: LLM generates answers strictly from retrieved context with citations
- **External Knowledge**: Automatically routes general knowledge questions to web search / LLM
- **Source Citations**: Document name, page number, section, and relevance score
- **Conversational Chat**: Maintains chat history for follow-up questions
- **Duplicate Detection**: Prevents re-uploading the same document
- **Dark-themed UI**: Modern, polished interface inspired by ChatGPT / Perplexity

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Gemini API Key** (get one at https://aistudio.google.com/app/apikey)
- *Optional*: Google Custom Search API Key for web search

## 🚀 Quick Start

### 1. Clone and configure

```bash
cd ai-research-assistant
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Backend setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start the backend server
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The first run will download embedding models (~90MB). The API will be available at `http://localhost:8000`.

### 3. Frontend setup

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. Upload documents and ask questions

1. Open `http://localhost:5173` in your browser
2. Click the upload button in the sidebar to upload a research paper PDF
3. Wait for processing and indexing to complete
4. Ask questions in the chat!

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GOOGLE_SEARCH_API_KEY` | ❌ | Google Custom Search API key (for external knowledge) |
| `GOOGLE_SEARCH_ENGINE_ID` | ❌ | Google Custom Search Engine ID |
| `EMBEDDING_MODEL` | ❌ | Sentence Transformer model (default: `all-MiniLM-L6-v2`) |
| `CROSS_ENCODER_MODEL` | ❌ | Cross-encoder model (default: `cross-encoder/ms-marco-MiniLM-L-6-v2`) |
| `LLM_MODEL` | ❌ | Gemini model name (default: `gemini-2.0-flash`) |
| `CHUNK_SIZE` | ❌ | Words per chunk (default: `512`) |
| `CHUNK_OVERLAP` | ❌ | Overlap words between chunks (default: `64`) |
| `TOP_K_RETRIEVAL` | ❌ | Chunks to retrieve (default: `10`) |
| `TOP_K_RERANK` | ❌ | Chunks after reranking (default: `5`) |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check with system status |
| `POST` | `/api/documents/upload` | Upload a PDF document |
| `GET` | `/api/documents` | List all uploaded documents |
| `DELETE` | `/api/documents/{id}` | Delete a document |
| `POST` | `/api/chat` | Ask a question |

### Chat Request

```json
{
  "question": "What learning rate was used?",
  "chat_history": [
    {"role": "user", "content": "previous question"},
    {"role": "assistant", "content": "previous answer"}
  ],
  "document_ids": []
}
```

### Chat Response

```json
{
  "answer": "The learning rate used was...",
  "citations": [
    {
      "document": "paper.pdf",
      "page": 4,
      "section": "4 Training",
      "snippet": "We use a learning rate of...",
      "score": 0.92,
      "source_type": "document"
    }
  ],
  "source_type": "document",
  "query_type": "document"
}
```

## 🔬 RAG Pipeline

1. **Document Ingestion**: PDF → text extraction (PyMuPDF) → section-aware chunking → embeddings (Sentence Transformers) → ChromaDB
2. **Query Classification**: Gemini classifies query as "document" or "external"
3. **Hybrid Retrieval**: Dense vector search + BM25 keyword search
4. **Reciprocal Rank Fusion**: Merges dense and sparse results
5. **Cross-Encoder Reranking**: Re-scores merged results for relevance
6. **Answer Generation**: Gemini generates an answer grounded in retrieved context
7. **Citation Extraction**: Source document, page number, and section metadata

## 📁 Project Structure

```
ai-research-assistant/
├── .env.example
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── uploads/              # Uploaded PDFs
│   ├── chroma_db/            # ChromaDB persistence
│   └── app/
│       ├── __init__.py
│       ├── main.py           # FastAPI app & endpoints
│       ├── config.py         # Environment configuration
│       ├── schemas.py        # Pydantic models
│       ├── document_processor.py  # PDF extraction & chunking
│       ├── embedding_service.py   # Sentence Transformer embeddings
│       ├── vector_store.py        # ChromaDB operations
│       ├── bm25_retriever.py      # BM25 sparse retrieval
│       ├── hybrid_retriever.py    # RRF fusion
│       ├── reranker.py            # Cross-encoder reranking
│       ├── rag_pipeline.py        # Main RAG pipeline
│       └── external_search.py     # Web search integration
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Sidebar.jsx
            ├── ChatWindow.jsx
            ├── ChatMessage.jsx
            ├── ChatInput.jsx
            ├── SourceCitation.jsx
            ├── DocumentUploader.jsx
            └── LoadingIndicator.jsx
```

## 🧪 Assessment Questions

The system handles both document-grounded and external knowledge questions:

| # | Question | Type |
|---|----------|------|
| Q1 | What exact learning rate, number of warmup steps, and Adam optimizer beta values were used? | 📄 Document |
| Q2 | Who is the current Chief Executive Officer of OpenAI? | 🌐 External |
| Q3 | By what percentage did the hybrid retrieval architecture improve EM accuracy? | 📄 Document |
| Q4 | What GPU cluster configuration and training duration were required? | 📄 Document |
| Q5 | What was the worldwide box-office revenue of Oppenheimer in 2023? | 🌐 External |

## 📄 License

MIT
