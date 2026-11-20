import React, { useRef, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  Sparkles,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({
  chats,
  activeChatId,
  documents,
  uploadProgress,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onUpload,
  onDeleteDocument,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      onUpload(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);

  return (
    <aside className="w-80 h-full bg-[#0c0d12] border-r border-white/5 flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-sm tracking-tight">Research AI</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  RAG
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Hybrid Context Retrieval</p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between py-2.5 px-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-medium text-xs transition-all duration-200 shadow-md shadow-indigo-600/25 cursor-pointer ring-1 ring-white/10 group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Research Chat</span>
          </div>
          <kbd className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-mono">⌘N</kbd>
        </button>
      </div>

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Knowledge Base & Upload Card */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Knowledge Base
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {documents.length} {documents.length === 1 ? 'Paper' : 'Papers'}
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          {/* Drag & Drop Upload Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all duration-200 mb-3 ${
              isDragging
                ? 'border-indigo-400 bg-indigo-500/10'
                : 'border-white/10 hover:border-indigo-500/40 bg-zinc-900/40 hover:bg-zinc-900/80'
            }`}
          >
            <UploadCloud className="w-5 h-5 mx-auto mb-1.5 text-indigo-400" />
            <p className="text-xs font-medium text-zinc-200">
              {uploadProgress !== null ? 'Indexing Document...' : 'Upload Research Paper'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Drop PDF here or click to browse</p>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl mb-3">
              <div className="flex justify-between text-xs text-indigo-300 mb-1.5 font-medium">
                <span>Ingesting & Embedding...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Documents List */}
          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="p-3 rounded-xl bg-zinc-900/30 border border-white/5 text-center">
                <AlertCircle className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
                <p className="text-xs text-zinc-400">No documents indexed yet.</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Upload a paper to enable grounded answers.</p>
              </div>
            ) : (
              documents.map((doc) => {
                const docId = doc.id || doc.document_id;
                return (
                  <div
                    key={docId}
                    className="group relative p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-white/10 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-200 truncate" title={doc.filename}>
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Indexed
                            </span>
                            <span>•</span>
                            <span>{doc.page_count} pages</span>
                            <span>•</span>
                            <span>{doc.chunk_count} chunks</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDocument(docId);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversations History */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Chat History
            </span>
            <span className="text-[11px] font-mono text-zinc-400">{chats.length}</span>
          </div>

          <div className="space-y-1">
            {chats.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/30'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span className="truncate font-medium">{c.title || 'New Chat'}</span>
                  </div>
                  {chats.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/5 bg-zinc-950/60">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="font-medium text-zinc-300">ChromaDB + BM25 + RRF</span>
          </div>
          <span className="font-mono text-zinc-400">{totalChunks} Chunks</span>
        </div>
      </div>
    </aside>
  );
}
