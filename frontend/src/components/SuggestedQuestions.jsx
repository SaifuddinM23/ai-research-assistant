import React from 'react';
import { Sparkles, Compass, Cpu, DollarSign, Layers, ArrowUpRight } from 'lucide-react';

const QUESTIONS = [
  {
    icon: Sparkles,
    category: 'Training Hyperparameters',
    question: 'What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?',
    badge: 'Research Paper',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Compass,
    category: 'Industry Leadership',
    question: 'Who is the current Chief Executive Officer of OpenAI?',
    badge: 'Web Knowledge',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Layers,
    category: 'Retrieval Benchmarks',
    question: 'By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?',
    badge: 'Research Paper',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Cpu,
    category: 'Compute Infrastructure',
    question: 'What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?',
    badge: 'Research Paper',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: DollarSign,
    category: 'Commercial Records',
    question: 'What was the worldwide box-office revenue of the film Oppenheimer in 2023?',
    badge: 'Web Knowledge',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {QUESTIONS.map((q, idx) => {
        const Icon = q.icon;
        return (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q.question)}
            className="group relative text-left p-3.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-white/5 hover:border-indigo-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-semibold text-xs text-zinc-300 group-hover:text-white transition-colors">
                    {q.category}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono ${q.badgeColor}`}>
                  {q.badge}
                </span>
              </div>

              <p className="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-2 leading-relaxed">
                {q.question}
              </p>
            </div>

            <div className="flex items-center justify-end mt-2 pt-1.5 border-t border-white/5 text-[11px] text-zinc-400 group-hover:text-indigo-400 font-medium gap-0.5">
              <span>Ask Query</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
