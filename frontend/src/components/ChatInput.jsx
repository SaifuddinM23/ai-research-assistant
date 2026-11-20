import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, Command } from 'lucide-react';

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
      className="relative flex flex-col bg-[#111219]/90 backdrop-blur-xl border border-white/10 focus-within:border-indigo-500/60 rounded-2xl shadow-xl shadow-black/40 transition-all duration-200"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about research papers, architectures, training hyperparams..."
        disabled={disabled}
        className="w-full resize-none bg-transparent pt-3.5 pb-2 pl-4 pr-14 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none min-h-[48px] max-h-[180px]"
      />

      {/* Bottom Bar inside Input */}
      <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1 text-indigo-400">
            <Sparkles className="w-3 h-3" />
            Hybrid Dense + BM25
          </span>
          <span>•</span>
          <span>Cross-Encoder Reranked</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
            Press <kbd className="bg-white/10 px-1 py-0.5 rounded text-zinc-400">Enter ↵</kbd>
          </span>

          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className={`p-2 rounded-xl transition-all duration-200 ${
              text.trim() && !disabled
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white cursor-pointer shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
