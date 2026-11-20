import React, { useRef, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  Sparkles,
  Database,
  PanelLeftClose
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
  onToggleSidebar,
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
    <div className="w-full h-full flex flex-col justify-between select-none bg-[#121318]">
      {/* Top Header */}
      <div className="p-4 border-b border-[#242630]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Research AI</span>
              <p className="text-[10px] text-zinc-400 font-mono">Hybrid RAG v2.0</p>
            </div>
          </div>

          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1e2029] hover:bg-[#252835] border border-[#2e303f] hover:border-indigo-500/60 text-white rounded-xl font-medium text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>New Research Chat</span>
        </button>
      </div>

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Knowledge Base Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Knowledge Base
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
              {documents.length} {documents.length === 1 ? 'Doc' : 'Docs'}
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

          {/* Drag & Drop Upload Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all mb-3 ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/40'
                : 'border-zinc-700 hover:border-indigo-500 bg-[#171821] hover:bg-[#1c1d29]'
            }`}
          >
            <UploadCloud className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
            <p className="text-xs font-medium text-zinc-200">
              {uploadProgress !== null ? `Indexing (${uploadProgress}%)...` : 'Upload Research Paper'}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">PDF paper or appendix</p>
          </div>

          {/* Document List */}
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-xs text-zinc-500 italic px-2 py-1">
                No documents indexed yet.
              </p>
            ) : (
              documents.map((doc) => {
                const docId = doc.id || doc.document_id;
                return (
                  <div
                    key={docId}
                    className="p-2.5 rounded-xl bg-[#171821] border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-200 truncate text-xs" title={doc.filename}>
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400 font-mono">
                            <span className="text-emerald-400 font-medium">● Indexed</span>
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
                        className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors shrink-0"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Chat History
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{chats.length}</span>
          </div>

          <div className="space-y-1">
            {chats.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-[#1e2029] text-white border border-[#2e303f] font-medium'
                      : 'text-zinc-400 hover:bg-[#171821] hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span className="truncate">{c.title || 'New Chat'}</span>
                  </div>
                  {chats.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
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
      <div className="p-3 border-t border-[#242630] bg-[#0e0f12]">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">ChromaDB + BM25</span>
          </div>
          <span className="text-indigo-400 font-medium">{totalChunks} Chunks</span>
        </div>
      </div>
    </div>
  );
}
