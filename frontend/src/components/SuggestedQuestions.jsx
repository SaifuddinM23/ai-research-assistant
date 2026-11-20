import React from 'react';
import { Sparkles, Compass, Cpu, DollarSign, Layers, ArrowRight } from 'lucide-react';

const QUESTIONS = [
  {
    icon: Sparkles,
    category: 'Hyperparameters',
    question: 'What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?',
    badge: 'Research Paper',
    isExternal: false,
  },
  {
    icon: Compass,
    category: 'Industry Leadership',
    question: 'Who is the current Chief Executive Officer of OpenAI?',
    badge: 'External Web',
    isExternal: true,
  },
  {
    icon: Layers,
    category: 'Benchmark Gain',
    question: 'By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?',
    badge: 'Research Paper',
    isExternal: false,
  },
  {
    icon: Cpu,
    category: 'GPU Cluster & Compute',
    question: 'What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?',
    badge: 'Research Paper',
    isExternal: false,
  },
  {
    icon: DollarSign,
    category: 'Box Office Figures',
    question: 'What was the worldwide box-office revenue of the film Oppenheimer in 2023?',
    badge: 'External Web',
    isExternal: true,
  },
];

export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {QUESTIONS.map((q, idx) => {
        const Icon = q.icon;
        return (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q.question)}
            className="group text-left p-4 rounded-xl bg-[#181920] hover:bg-[#1f212c] border border-[#2b2d3a] hover:border-indigo-500/70 transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-indigo-500/5"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-gray-200 group-hover:text-white transition-colors">
                    {q.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium border ${
                    q.isExternal
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                  }`}
                >
                  {q.badge}
                </span>
              </div>

              <p className="text-xs text-gray-300 group-hover:text-gray-100 line-clamp-3 leading-relaxed">
                {q.question}
              </p>
            </div>

            <div className="flex items-center justify-end mt-3 pt-2 border-t border-[#242630] text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 gap-1">
              <span>Ask Question</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
