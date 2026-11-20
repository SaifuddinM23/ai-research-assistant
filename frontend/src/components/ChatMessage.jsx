import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { User, Bot, Globe, FileText, AlertCircle } from 'lucide-react';
import SourceCitation from './SourceCitation';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isExternal = message.source_type === 'external';
  const isError = message.source_type === 'error';

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[85%] lg:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Source Badge */}
        {!isUser && !isError && (
          <div className="flex items-center gap-1.5 mb-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide">
            {isExternal ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2 py-0.5 rounded-full">
                <Globe className="w-3 h-3" /> External Knowledge / Web
              </span>
            ) : (
              <span className="flex items-center gap-1 text-indigo-400 bg-indigo-950/50 border border-indigo-900/60 px-2 py-0.5 rounded-full">
                <FileText className="w-3 h-3" /> Grounded in Research Papers
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
              : isError
              ? 'bg-red-950/40 text-red-200 border border-red-900/50 rounded-tl-xs'
              : 'bg-gray-900 text-gray-100 border border-gray-800 rounded-tl-xs shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-pre:my-2 prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-800 prose-code:text-indigo-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations section */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="w-full mt-3 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-1">
              Sources & Citations ({message.citations.length})
            </span>
            <div className="grid grid-cols-1 gap-2">
              {message.citations.map((cite, index) => (
                <SourceCitation key={index} citation={cite} index={index + 1} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700 mt-1">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      )}
    </div>
  );
}
