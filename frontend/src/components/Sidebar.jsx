import React, { useRef, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  Upload,
  Sparkles,
  Database,
  Layers,
  CheckCircle2
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

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);

  return (
    <aside className="w-80 h-full bg-[#131419] border-r border-[#242630] flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-[#242630]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight">Research AI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hybrid RAG
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Dense + BM25 + Cross-Encoder</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Research Chat</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">⌘N</span>
        </button>
      </div>

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-6">
        {/* Knowledge Base Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Knowledge Base
              </span>
            </div>
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/60 font-medium">
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

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all mb-3 ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/50'
                : 'border-[#363847] hover:border-indigo-500 bg-[#181920] hover:bg-[#1e2029]'
            }`}
          >
            <Upload className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
            <p className="text-xs font-semibold text-gray-200">
              {uploadProgress !== null ? `Indexing (${uploadProgress}%)...` : 'Upload Research Paper'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">PDF paper or technical appendix</p>
          </div>

          {/* Documents List */}
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-xs text-gray-500 italic px-2 py-1">
                No papers indexed yet. Upload a PDF to start asking questions.
              </p>
            ) : (
              documents.map((doc) => {
                const docId = doc.id || doc.document_id;
                return (
                  <div
                    key={docId}
                    className="p-3 rounded-xl bg-[#181920] border border-[#2b2d3a] hover:border-indigo-500/50 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-100 truncate text-xs" title={doc.filename}>
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-mono">
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Indexed
                            </span>
                            <span>•</span>
                            <span>{doc.page_count}p</span>
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
                        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all shrink-0 cursor-pointer"
                        title="Delete paper"
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Conversations
            </span>
            <span className="text-[11px] font-mono text-gray-400">{chats.length}</span>
          </div>

          <div className="space-y-1">
            {chats.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-semibold'
                      : 'text-gray-400 hover:bg-[#181920] hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                    <span className="truncate">{c.title || 'New Chat'}</span>
                  </div>
                  {chats.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
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
      <div className="p-3.5 border-t border-[#242630] bg-[#0e0f12]">
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-gray-300">ChromaDB + BM25</span>
          </div>
          <span className="text-indigo-300 font-medium">{totalChunks} Chunks</span>
        </div>
      </div>
    </aside>
  );
}
