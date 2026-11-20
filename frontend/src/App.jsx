import React, { useState, useEffect, useRef } from 'react';
import { getDocuments, uploadDocument, sendMessage } from './api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  BookOpen,
  Zap,
  Search,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react';

const QUICK_QUESTIONS = [
  {
    id: 'Q1',
    label: 'Q1: Training Hyperparameters (Section 4)',
    question: 'What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?',
  },
  {
    id: 'Q2',
    label: 'Q2: OpenAI CEO (Negative Test)',
    question: 'Who is the current Chief Executive Officer of OpenAI?',
  },
  {
    id: 'Q3',
    label: 'Q3: Hybrid Retrieval EM Gain',
    question: 'By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?',
  },
  {
    id: 'Q4',
    label: 'Q4: 13B Model GPU Configuration',
    question: 'What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?',
  },
  {
    id: 'Q5',
    label: 'Q5: Oppenheimer Box Office (Negative Test)',
    question: 'What was the worldwide box-office revenue of the film Oppenheimer in 2023?',
  },
];

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      await uploadDocument(file, (p) => setUploadProgress(p));
      await fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleSearch = async (questionToAsk) => {
    const q = (questionToAsk || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const documentIds = documents.map((d) => d.id || d.document_id);
      const res = await sendMessage(q, [], documentIds);
      const botMessage = {
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations || [],
        source_type: res.data.source_type,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'The uploaded documents do not contain sufficient information to answer this question.',
          citations: [],
          source_type: 'document',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputQuestion('');
  };

  const activeDoc = documents[0];
  const docFilename = activeDoc?.filename || 'transformer_rag_research_paper_50p.pdf';
  const pageCount = activeDoc?.page_count || 50;

  return (
    <div className="flex h-screen w-screen bg-[#0e0f14] text-zinc-100 overflow-hidden font-sans">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <aside className="w-80 shrink-0 h-full bg-[#12131a] border-r border-[#1f212d] p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-7">
          {/* Section: System Overview */}
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-base">📖</span>
              <h2 className="text-sm font-bold text-white tracking-wide">System Overview</h2>
            </div>

            <ul className="space-y-3 text-xs text-zinc-300">
              <li>
                <div className="text-zinc-400 font-medium mb-1">• Corpus:</div>
                <div className="bg-[#181a24] text-emerald-400 border border-emerald-900/50 rounded px-2.5 py-1.5 font-mono text-[11px] break-all">
                  {docFilename}
                </div>
              </li>
              <li className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-zinc-400">• Pages:</span>
                <span className="font-semibold text-white">{pageCount} Pages</span>
              </li>
              <li className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-zinc-400">• Vector DB:</span>
                <span className="text-zinc-200">ChromaDB (Persistent)</span>
              </li>
              <li>
                <span className="text-zinc-400">• Embeddings: </span>
                <span className="text-emerald-400 font-mono text-[11px]">all-MiniLM-L6-v2</span>
                <div className="text-zinc-400 text-[10px] pl-2 mt-0.5">(Dense Vector + BM25 Hybrid)</div>
              </li>
              <li>
                <span className="text-zinc-400">• Strict Grounding: </span>
                <span className="text-zinc-200">Enabled (</span>
                <span className="text-emerald-400 font-mono text-[11px]">[not found]</span>
                <span className="text-zinc-200"> fallback)</span>
              </li>
            </ul>

            {/* Hidden upload input & small button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress !== null}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#181a24] hover:bg-[#202330] border border-zinc-700 hover:border-zinc-500 rounded-lg text-[11px] text-zinc-300 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>{uploadProgress !== null ? `Uploading (${uploadProgress}%)...` : 'Upload Another PDF'}</span>
            </button>
          </div>

          {/* Section: Quick Assessment Questions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Quick Assessment Questions
              </h2>
            </div>

            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSearch(q.question)}
                  className="w-full text-left p-2.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#262838] hover:border-zinc-500 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-medium leading-snug"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 mt-6 border-t border-[#1f212d] text-[10px] text-zinc-400 font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ChromaDB Active
          </span>
          <span>v2.0 RAG</span>
        </div>
      </aside>

      {/* ───────────────── MAIN CONTENT AREA ───────────────── */}
      <main className="flex-1 h-full flex flex-col bg-[#0e0f14] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 lg:px-14 py-10 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔬</span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#7487a8] tracking-tight">
                AI Research Assistant – Hybrid RAG
              </h1>
            </div>
            <p className="text-xs lg:text-sm text-zinc-400 italic">
              Interactive Q&A powered by ChromaDB Vector Database & Strictly Grounded Inference for ML Research Paper
            </p>
          </div>

          {/* Search Box Card */}
          <div className="mb-8 bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 shadow-xl">
            <label className="block text-xs font-semibold text-zinc-300 mb-2.5">
              Ask any technical question, architecture detail, hyperparameter, or benchmark result:
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="e.g., What exact learning rate, warmup steps, and optimizer beta values were used in Section 4?"
                className="w-full bg-[#181a24] border-2 border-rose-500/80 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
              />

              <div className="flex items-center gap-3 mt-3.5">
                <button
                  type="submit"
                  disabled={isLoading || !inputQuestion.trim()}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-xs tracking-wide transition-all shadow-md cursor-pointer ${
                    inputQuestion.trim() && !isLoading
                      ? 'bg-[#ff5555] hover:bg-[#ff4444] text-white shadow-rose-500/30'
                      : 'bg-[#ff5555]/60 text-white/70 cursor-not-allowed'
                  }`}
                >
                  Search & Answer
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  className="px-4 py-2.5 rounded-lg font-semibold text-xs bg-[#181a24] hover:bg-[#202330] border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Clear Chat
                </button>
              </div>
            </form>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mb-6 p-4 rounded-xl bg-[#12131a] border border-[#1f212d] flex items-center gap-3 text-xs text-zinc-300">
              <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
              <span>Querying ChromaDB vector embeddings & BM25 sparse index...</span>
            </div>
          )}

          {/* Chat Messages / Q&A Cards */}
          <div className="space-y-5 pb-10">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border ${
                  m.role === 'user'
                    ? 'bg-[#181a24] border-[#292c3d]'
                    : 'bg-[#12131a] border-[#1f212d]'
                }`}
              >
                {/* Header label */}
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/80">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {m.role === 'user' ? '🧑 Question' : '🤖 Response'}
                  </span>
                  {m.role === 'assistant' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
                      Grounded Inference
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="markdown-body text-sm text-zinc-200 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>

                {/* Citations Box */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Verified Document Citations:
                    </div>
                    <div className="space-y-1.5">
                      {m.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181a24] border border-[#262838] text-xs font-mono text-zinc-300"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-zinc-200 font-semibold">{c.document}</span>
                          <span className="text-zinc-400">• Page {c.page}</span>
                          {c.section && c.section !== 'Unknown' && (
                            <span className="text-indigo-300 truncate">• {c.section}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
