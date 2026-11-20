import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-[#181920] border border-[#2e303e] focus-within:border-indigo-500 rounded-2xl shadow-2xl transition-all"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about research papers, architectures, training hyperparams..."
        disabled={disabled}
        className="w-full resize-none bg-transparent pt-3.5 pb-2 pl-4 pr-12 text-sm text-gray-100 placeholder-gray-500 focus:outline-none min-h-[50px] max-h-[180px] leading-relaxed"
      />

      {/* Action / Tag Bar */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-[#242630]">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
          <span className="flex items-center gap-1 text-indigo-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Hybrid RAG Mode
          </span>
          <span>•</span>
          <span>Dense + BM25 + Cross-Encoder</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
            Press <kbd className="bg-[#242630] px-1.5 py-0.5 rounded text-gray-400">Enter ↵</kbd>
          </span>

          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              text.trim() && !disabled
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#242630] text-gray-600 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
