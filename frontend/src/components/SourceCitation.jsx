import React, { useState } from 'react';
import { FileText, Globe, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';

export default function SourceCitation({ citation, index }) {
  const [expanded, setExpanded] = useState(false);
  const isWeb = citation.source_type === 'web';

  return (
    <div className="bg-[#181920] border border-[#2b2d3a] hover:border-indigo-500/60 rounded-xl transition-all overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
            {index}
          </span>

          {isWeb ? (
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}

          <span className="font-semibold text-xs text-gray-200 truncate">
            {citation.document}
          </span>

          {!isWeb && citation.page && (
            <span className="px-2 py-0.5 rounded-md bg-[#242630] border border-[#363847] text-[10px] text-gray-300 font-mono font-medium shrink-0">
              Page {citation.page}
            </span>
          )}

          {citation.section && citation.section !== 'Unknown' && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 text-[10px] truncate max-w-[200px] border border-indigo-900/60 hidden md:inline">
              {citation.section}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {citation.score !== 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#242630] text-[10px] text-gray-400 font-mono">
              score: {citation.score}
            </span>
          )}
          <div className="p-1 rounded text-gray-400 hover:text-gray-200">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 text-xs text-gray-300 border-t border-[#242630] bg-[#121318]">
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-1.5">
            <Bookmark className="w-3 h-3" />
            <span>Extracted Passage</span>
          </div>
          <p className="whitespace-pre-wrap bg-[#181920] p-3 rounded-lg border border-[#2b2d3a] text-xs text-gray-300 font-mono leading-relaxed">
            {citation.snippet}
          </p>
        </div>
      )}
    </div>
  );
}
