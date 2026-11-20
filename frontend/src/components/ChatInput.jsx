import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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
    <form onSubmit={handleSubmit} className="relative flex items-end bg-gray-900 border border-gray-800 focus-within:border-indigo-500/80 rounded-2xl shadow-lg transition-all duration-200">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about research papers, architectures, hyperparams..."
        disabled={disabled}
        className="w-full resize-none bg-transparent py-3.5 pl-4 pr-12 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
      />

      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className={`absolute right-2.5 bottom-2.5 p-2 rounded-xl transition-all duration-200 ${
          text.trim() && !disabled
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/30'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
        }`}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </form>
  );
}
