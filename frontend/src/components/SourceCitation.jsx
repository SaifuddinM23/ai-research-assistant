import React, { useState } from 'react';
import { FileText, Globe, ChevronDown, ChevronUp, ExternalLink, Bookmark } from 'lucide-react';

export default function SourceCitation({ citation, index }) {
  const [expanded, setExpanded] = useState(false);
  const isWeb = citation.source_type === 'web';

  return (
    <div className="bg-zinc-900/70 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="w-5 h-5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-mono font-semibold shrink-0">
            {index}
          </span>

          {isWeb ? (
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}

          <span className="font-medium text-xs text-zinc-200 truncate">
            {citation.document}
          </span>

          {!isWeb && citation.page && (
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-300 font-mono shrink-0">
              Page {citation.page}
            </span>
          )}

          {citation.section && citation.section !== 'Unknown' && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] truncate max-w-[200px] hidden md:inline">
              {citation.section}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {citation.score !== 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-zinc-400 font-mono">
              relevance: {citation.score}
            </span>
          )}
          <div className="p-1 rounded-md hover:bg-white/5 text-zinc-400 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 text-xs text-zinc-300 border-t border-white/5 bg-black/30 font-mono leading-relaxed">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">
            <Bookmark className="w-3 h-3 text-indigo-400" />
            <span>Extracted Passage</span>
          </div>
          <p className="whitespace-pre-wrap bg-zinc-950/60 p-2.5 rounded-lg border border-white/5 text-[11px] text-zinc-300">
            {citation.snippet}
          </p>
        </div>
      )}
    </div>
  );
}
