import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import LoadingIndicator from './LoadingIndicator';
import { Sparkles, BookOpen } from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-full bg-gray-950 relative overflow-hidden">
      {/* Messages or Welcome View */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {!hasMessages ? (
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-center items-center text-center px-4 py-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-100 mb-3">
              Your Research, Understood.
            </h1>
            <p className="text-base text-gray-400 max-w-xl mb-10 leading-relaxed">
              Ask questions about research papers, architectures, experiments, and results. Grounded in context with precise citations.
            </p>

            <div className="w-full max-w-2xl text-left">
              <SuggestedQuestions onSelectQuestion={onSendMessage} />
            </div>

            {documentCount === 0 && (
              <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-300">
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Tip: Upload research papers using the left sidebar to enable document-grounded answers.</span>
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

      {/* Input bar at bottom */}
      <div className="p-4 lg:px-8 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSendMessage} disabled={isLoading} />
          <p className="text-center text-[11px] text-gray-500 mt-2">
            Hybrid RAG: Dense Vector (ChromaDB) + BM25 + Reciprocal Rank Fusion + Cross-Encoder Reranker
          </p>
        </div>
      </div>
    </div>
  );
}
