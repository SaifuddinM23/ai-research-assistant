import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import LoadingIndicator from './LoadingIndicator';
import { Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function ChatWindow({
  chat,
  isLoading,
  onSendMessage,
  documentCount,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, isLoading]);

  const hasMessages = chat?.messages && chat.messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e0f12] relative overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-[#242630] px-6 flex items-center justify-between bg-[#131419]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-100 truncate max-w-xs sm:max-w-md">
            {chat?.title || 'Research Session'}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Layers className="w-3 h-3 text-indigo-400" />
            Hybrid: Dense Vector + BM25
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{documentCount} {documentCount === 1 ? 'Paper Active' : 'Papers Active'}</span>
        </div>
      </header>

      {/* Main Chat Content Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {!hasMessages ? (
          <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-center items-center text-center py-8">
            {/* Hero Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Context-Grounded AI Research Assistant</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Your Research, <span className="text-indigo-400">Understood.</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-lg mb-8 leading-relaxed">
              Ask questions about architectures, training hyperparameters, ablations, and benchmarks with verified page-level citations.
            </p>

            {/* Suggested Question Cards */}
            <div className="w-full max-w-2xl text-left mb-6">
              <SuggestedQuestions onSelectQuestion={onSendMessage} />
            </div>

            {documentCount === 0 ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Upload a research paper PDF in the sidebar to enable document-grounded answers.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Reference monograph indexed in ChromaDB • Ready for queries</span>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 pb-6">
            {chat.messages.map((message, idx) => (
              <ChatMessage key={idx} message={message} />
            ))}

            {isLoading && <LoadingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="p-4 lg:px-8 bg-gradient-to-t from-[#0e0f12] via-[#0e0f12]/95 to-transparent shrink-0">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
