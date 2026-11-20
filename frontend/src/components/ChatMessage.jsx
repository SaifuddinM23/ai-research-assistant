import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { User, Sparkles, Globe, FileText, Check, Copy, ExternalLink, Cpu } from 'lucide-react';
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
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 ring-1 ring-white/10 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[82%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Source Badge Bar */}
        {!isUser && !isError && (
          <div className="flex items-center gap-2 mb-2">
            {isExternal ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <Globe className="w-3 h-3" /> External Web Knowledge
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                <FileText className="w-3 h-3" /> Grounded in Research Papers
              </span>
            )}

            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
              Dense + BM25 + Cross-Encoder
            </span>
          </div>
        )}

        {/* Message Container */}
        <div
          className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed relative group ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-white/10 rounded-tr-xs'
              : isError
              ? 'bg-red-950/40 text-red-200 border border-red-800/60 rounded-tl-xs'
              : 'bg-zinc-900/90 text-zinc-100 border border-white/5 shadow-md shadow-black/20 rounded-tl-xs'
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
                className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-xs flex items-center gap-1"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sources & Citations Drawer */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="w-full mt-3.5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Verified Citations ({message.citations.length})
              </span>
              <span className="text-[10px] text-zinc-400">Click to expand excerpt</span>
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
        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10 mt-1">
          <User className="w-4 h-4 text-zinc-300" />
        </div>
      )}
    </div>
  );
}
