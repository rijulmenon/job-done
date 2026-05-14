"use client";

import { EvaluationResult } from "@/lib/types";

interface Props {
  result: EvaluationResult;
  candidateName: string;
}

const categoryConfig = {
  Beginner: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    bar: "bg-orange-400",
  },
  Intermediate: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    bar: "bg-yellow-400",
  },
  Expert: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    bar: "bg-emerald-400",
  },
};

export default function ScoreCard({ result, candidateName }: Props) {
  const cfg = categoryConfig[result.category] ?? categoryConfig["Intermediate"];

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-slate-400 text-sm mb-2">
          Interview Readiness Score for{" "}
          <span className="text-white font-medium">{candidateName}</span>
        </p>

        {/* Score circle */}
        <div className="relative inline-flex items-center justify-center w-36 h-36 my-4">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r="60"
              fill="none"
              stroke="#1e293b"
              strokeWidth="12"
            />
            <circle
              cx="72"
              cy="72"
              r="60"
              fill="none"
              stroke={result.score >= 71 ? "#34d399" : result.score >= 41 ? "#facc15" : "#fb923c"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(result.score / 100) * 376.99} 376.99`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-4xl font-bold text-white">{result.score}</span>
            <span className="block text-slate-400 text-xs">/ 100</span>
          </div>
        </div>

        {/* Category badge */}
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
        >
          {result.category}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Current Standing
        </h2>
        <p className="text-slate-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          30-Day Action Roadmap
        </h2>
        <div className="space-y-4">
          {result.roadmap.map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
                {i + 1}
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">
                  {item.title}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Beginner</span>
          <span>Intermediate</span>
          <span>Expert</span>
        </div>
        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
          {/* Zone markers */}
          <div className="absolute inset-0 flex">
            <div className="w-[40%] border-r border-slate-700" />
            <div className="w-[30%] border-r border-slate-700" />
          </div>
          {/* Score fill */}
          <div
            className={`h-full rounded-full transition-all duration-1000 ${cfg.bar}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0</span>
          <span>40</span>
          <span>70</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
