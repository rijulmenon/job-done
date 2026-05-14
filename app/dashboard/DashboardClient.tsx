"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { EvaluationRecord } from "@/lib/types";
import QuickScore from "./QuickScore";
import InterviewPrep from "./InterviewPrep";

interface Props {
  user: { email: string };
  evaluations: EvaluationRecord[];
}

type Tab = "quick" | "prep" | "history";

export default function DashboardClient({ user, evaluations }: Props) {
  const [tab, setTab] = useState<Tab>("quick");
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navItems: { id: Tab; label: string; icon: string; desc: string }[] = [
    {
      id: "quick",
      label: "Quick Score",
      icon: "⚡",
      desc: "2-min readiness check",
    },
    {
      id: "prep",
      label: "Interview Prep",
      icon: "🎯",
      desc: "Company-targeted prep",
    },
    {
      id: "history",
      label: "History",
      icon: "📋",
      desc: "Past evaluations",
    },
  ];

  const categoryColor: Record<string, string> = {
    Beginner: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Intermediate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    Expert: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <span className="text-white font-bold text-lg">Job Done</span>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{user.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                tab === item.id
                  ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
              }`}
            >
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <p className="font-medium text-sm leading-none mb-1">
                  {item.label}
                </p>
                <p className="text-xs opacity-60">{item.desc}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="ml-64 flex-1 px-8 py-10 min-h-screen">
        {tab === "quick" && <QuickScore />}
        {tab === "prep" && <InterviewPrep userEmail={user.email} />}
        {tab === "history" && (
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-white mb-1">Evaluation History</h1>
            <p className="text-slate-400 text-sm mb-6">Your past quick score evaluations.</p>

            {evaluations.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400 mb-4">No evaluations yet.</p>
                <button
                  onClick={() => setTab("quick")}
                  className="text-sky-400 hover:underline font-medium"
                >
                  Run your first evaluation →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluations.map((rec) => (
                  <div key={rec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-white font-semibold text-lg">{rec.candidate_name}</h2>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColor[rec.category] ?? ""}`}>
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-0.5">
                          {rec.college} · {rec.pass_out_year} · CGPA {rec.cgpa}
                        </p>
                        <p className="text-slate-300 text-sm mt-3 leading-relaxed line-clamp-2">
                          {rec.summary}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-center">
                        <div className="text-3xl font-bold text-white">{rec.score}</div>
                        <div className="text-slate-500 text-xs">/ 100</div>
                      </div>
                    </div>
                    {rec.roadmap?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Action</p>
                        <p className="text-slate-300 text-sm">
                          <span className="text-sky-400 font-medium">{rec.roadmap[0].title}:</span>{" "}
                          {rec.roadmap[0].description}
                        </p>
                      </div>
                    )}
                    <p className="text-slate-600 text-xs mt-4">
                      {new Date(rec.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
