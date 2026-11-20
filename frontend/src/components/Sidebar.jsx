import React, { useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  Upload,
  Settings,
  Sparkles,
  Layers,
  ChevronRight,
  Database
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <aside className="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-gray-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-100 text-base leading-tight tracking-tight">
                Research AI
              </h1>
              <p className="text-xs text-indigo-400 font-medium">Hybrid RAG System</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm shadow-indigo-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Middle Scrollable Section: Chats & Documents */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {/* Chat History */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Conversations
            </span>
            <span className="text-xs text-gray-500 font-mono">{chats.length}</span>
          </div>

          <div className="space-y-1">
            {chats.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-gray-800 text-gray-100 shadow-inner'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                    <span className="truncate text-xs font-medium">{c.title || 'New Chat'}</span>
                  </div>
                  {chats.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Uploaded Documents Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Knowledge Base
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono">{documents.length}</span>
          </div>

          {/* Upload trigger button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
            className="w-full flex items-center justify-center gap-2 p-2.5 mb-2.5 rounded-xl border border-dashed border-gray-700 hover:border-indigo-500/60 bg-gray-900/60 hover:bg-gray-800/40 text-gray-300 hover:text-indigo-300 transition-all text-xs font-medium cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Research Paper (PDF)</span>
          </button>

          {/* Upload Progress Indicator */}
          {uploadProgress !== null && (
            <div className="p-3 bg-gray-800/80 rounded-xl mb-3 border border-indigo-500/30">
              <div className="flex justify-between text-xs text-indigo-300 mb-1.5">
                <span>Ingesting & Indexing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-1.5">
            {documents.length === 0 ? (
              <p className="text-xs text-gray-500 px-2 py-1 italic">
                No documents indexed yet. Upload a PDF paper to ground answers.
              </p>
            ) : (
              documents.map((doc) => {
                const docId = doc.id || doc.document_id;
                return (
                  <div
                    key={docId}
                    className="group flex flex-col p-2.5 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-800 hover:border-gray-700 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-medium text-gray-200 truncate" title={doc.filename}>
                          {doc.filename}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteDocument(docId)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded transition-opacity"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                      <span>{doc.page_count} pages</span>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.size_bytes)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-800/80 bg-gray-900/60">
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hybrid RAG Active</span>
          </div>
          <span className="text-[10px] text-gray-500">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
