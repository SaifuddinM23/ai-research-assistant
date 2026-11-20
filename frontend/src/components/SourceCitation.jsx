import React, { useState } from 'react';
import { FileText, Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function SourceCitation({ citation, index }) {
  const [expanded, setExpanded] = useState(false);
  const isWeb = citation.source_type === 'web';

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 text-xs hover:border-gray-700 transition-all">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center text-[10px] font-mono shrink-0">
            {index}
          </span>
          {isWeb ? (
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}
          <span className="font-semibold text-gray-200 truncate">
            {citation.document}
          </span>
          {!isWeb && (
            <span className="text-gray-400 shrink-0">
              • Page {citation.page}
            </span>
          )}
          {citation.section && citation.section !== 'Unknown' && (
            <span className="text-gray-400 truncate max-w-[150px] hidden sm:inline">
              • {citation.section}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {citation.score > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400 font-mono">
              score: {citation.score}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-800/80 text-gray-300 text-[11px] leading-relaxed font-mono bg-gray-950/60 p-2 rounded-lg">
          <p className="whitespace-pre-wrap">{citation.snippet}</p>
        </div>
      )}
    </div>
  );
}
