import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { User, Sparkles, Globe, FileText, Check, Copy } from 'lucide-react';
import SourceCitation from './SourceCitation';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isExternal = message.source_type === 'external';
  const isError = message.source_type === 'error';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 text-white mt-1">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[82%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Source Badge Bar */}
        {!isUser && !isError && (
          <div className="flex items-center gap-2 mb-2">
            {isExternal ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> External Web Knowledge
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-sm">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Grounded in Research Papers
              </span>
            )}

            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
              Dense + BM25 + Cross-Encoder
            </span>
          </div>
        )}

        {/* Message Container */}
        <div
          className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed relative group ${
            isUser
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-tr-xs font-normal'
              : isError
              ? 'bg-red-950/50 text-red-200 border border-red-800 rounded-tl-xs'
              : 'bg-[#181920] text-gray-100 border border-[#2b2d3a] shadow-lg rounded-tl-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1.5 rounded-lg bg-[#242630] hover:bg-[#2e303e] text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Citations Drawer */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="w-full mt-3.5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Verified Sources ({message.citations.length})
              </span>
              <span className="text-[11px] text-gray-500">Click to expand excerpt</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {message.citations.map((cite, index) => (
                <SourceCitation key={index} citation={cite} index={index + 1} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#242630] flex items-center justify-center shrink-0 border border-[#363847] text-gray-300 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
