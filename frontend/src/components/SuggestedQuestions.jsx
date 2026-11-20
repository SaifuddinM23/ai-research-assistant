import React from 'react';
import { Sparkles, Compass, Cpu, DollarSign } from 'lucide-react';

const QUESTIONS = [
  {
    icon: Sparkles,
    title: 'Training Hyperparameters',
    question: 'What exact learning rate, number of warmup steps, and Adam optimizer beta values were used in the primary pre-training run described in Section 4?',
    tag: 'Research Paper',
  },
  {
    icon: Compass,
    title: 'Executive Leadership',
    question: 'Who is the current Chief Executive Officer of OpenAI?',
    tag: 'External Knowledge',
  },
  {
    icon: Cpu,
    title: 'Benchmark Accuracy',
    question: 'By what percentage did the proposed hybrid retrieval architecture improve Exact Match (EM) accuracy on the benchmark dataset compared with the dense-only baseline?',
    tag: 'Research Paper',
  },
  {
    icon: Cpu,
    title: 'Hardware & Compute',
    question: 'What GPU cluster configuration (number and model of GPUs) and total training duration, in days, were required to train the 13-billion-parameter model?',
    tag: 'Research Paper',
  },
  {
    icon: DollarSign,
    title: 'Box Office Figures',
    question: 'What was the worldwide box-office revenue of the film Oppenheimer in 2023?',
    tag: 'External Knowledge',
  },
];

export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {QUESTIONS.map((q, idx) => {
        const Icon = q.icon;
        return (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q.question)}
            className="group text-left p-3.5 rounded-xl bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-gray-200 group-hover:text-indigo-300 transition-colors">
                  {q.title}
                </span>
                <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-800/80">
                  {q.tag}
                </span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {q.question}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
