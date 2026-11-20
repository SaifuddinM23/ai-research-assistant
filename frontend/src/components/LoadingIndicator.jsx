import React from 'react';
import { Sparkles, Loader2, Database, Search, ArrowRight } from 'lucide-react';

export default function LoadingIndicator() {
  return (
    <div className="flex gap-3.5 justify-start items-start">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 ring-1 ring-white/10 mt-1">
        <Sparkles className="w-4 h-4 text-white animate-spin" />
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/5 rounded-tl-xs shadow-md shadow-black/20 text-xs text-zinc-300 max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          <span className="font-semibold text-zinc-200">Executing Hybrid RAG Pipeline...</span>
        </div>

        <div className="space-y-1.5 text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>Dense Vector Retrieval (ChromaDB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>Sparse Keyword Retrieval (BM25 Okapi)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Reciprocal Rank Fusion & Cross-Encoder Reranking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
