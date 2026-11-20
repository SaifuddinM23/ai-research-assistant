import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import LoadingIndicator from './LoadingIndicator';
import { Sparkles, BookOpen, Layers, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] relative overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-[#0c0d12]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-zinc-200 truncate max-w-xs sm:max-w-md">
            {chat?.title || 'Research Session'}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-3 h-3" />
            Hybrid Dense + BM25 + Cross-Encoder
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{documentCount} {documentCount === 1 ? 'Paper Active' : 'Papers Active'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {!hasMessages ? (
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-center items-center text-center px-4 py-8">
            {/* Hero Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Context-Grounded Research Engine</span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Your Research, <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">Understood.</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-8 leading-relaxed">
              Ask deep questions about machine learning architectures, training configs, loss functions, and benchmark results with verified page-level citations.
            </p>

            {/* Suggested Question Cards */}
            <div className="w-full max-w-2xl text-left">
              <SuggestedQuestions onSelectQuestion={onSendMessage} />
            </div>

            {/* Document Status Banner */}
            {documentCount === 0 ? (
              <div className="mt-8 flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Upload a research paper PDF in the sidebar to enable document-grounded question answering.</span>
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* Input Bar at Bottom */}
      <div className="p-4 lg:px-8 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
