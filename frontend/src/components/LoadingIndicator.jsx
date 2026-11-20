import React from 'react';
import { Bot, Loader2 } from 'lucide-react';

export default function LoadingIndicator() {
  return (
    <div className="flex gap-3.5 justify-start items-center">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
        <Bot className="w-4 h-4 text-white" />
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-xs text-sm text-gray-400">
        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        <span className="animate-pulse text-xs">
          Searching knowledge base, reranking & synthesizing answer...
        </span>
      </div>
    </div>
  );
}
