"use client";

import { useState, useRef } from "react";
import { PrepProfile, CompanySuggestions, InterviewQuestion, AnswerFeedback } from "@/lib/types";
import VirtualInterview from "./VirtualInterview";

const MCQ_QUESTIONS = [
  { id: 1, question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct: 1 },
  { id: 2, question: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Heap", "Graph"], correct: 1 },
  { id: 3, question: "What does REST stand for?", options: ["Remote Execution State Transfer", "Representational State Transfer", "Resource Endpoint State Transfer", "Reliable State Transfer"], correct: 1 },
  { id: 4, question: "Which sorting algorithm has the best average-case complexity?", options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], correct: 2 },
  { id: 5, question: "What is a foreign key in a database?", options: ["A primary key in another table", "A key that references a primary key in another table", "An encrypted key", "A composite key"], correct: 1 },
];

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple",
  "Netflix", "Flipkart", "Infosys", "TCS", "Wipro",
  "Zomato", "Swiggy", "Razorpay", "CRED", "Zepto",
  "Atlassian", "Salesforce", "Adobe", "Uber", "Airbnb",
];

type Step = "profile" | "mcq" | "company" | "suggestions" | "interview" | "results";

interface Props { userEmail: string; }

export default function InterviewPrep({ userEmail }: Props) {
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<Partial<PrepProfile>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CompanySuggestions | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [results, setResults] = useState<{ feedback: AnswerFeedback[]; postureScore: number; eyeContactScore: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile step ──────────────────────────────────────────────────────────
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText) { setError("Please upload your resume PDF."); return; }
    setError("");
    setStep("mcq");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true); setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse PDF.");
      setResumeText(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse PDF.");
      setFileName("");
    } finally {
      setPdfLoading(false);
    }
  }

  // ── MCQ step ──────────────────────────────────────────────────────────────
  function handleMcqAnswer(qId: number, idx: number) {
    setMcqAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  function handleMcqSubmit() {
    if (Object.keys(mcqAnswers).length < MCQ_QUESTIONS.length) {
      setError("Please answer all questions.");
      return;
    }
    setError("");
    setStep("company");
  }

  // ── Company step ──────────────────────────────────────────────────────────
  async function handleCompanySelect(company: string) {
    setProfile((prev) => ({ ...prev, targetCompany: company }));
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/prep-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          resumeText,
          targetCompany: company,
          mcqAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get suggestions.");
      setSuggestions(data.suggestions);
      setQuestions(data.questions);
      setStep("suggestions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  // ── Interview done ────────────────────────────────────────────────────────
  function handleInterviewDone(feedback: AnswerFeedback[], postureScore: number, eyeContactScore: number) {
    setResults({ feedback, postureScore, eyeContactScore });
    setStep("results");
  }

  const mcqScore = MCQ_QUESTIONS.filter((q) => mcqAnswers[q.id] === q.correct).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["profile", "mcq", "company", "suggestions"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
              step === s ? "bg-sky-500 border-sky-500 text-white" :
              ["profile","mcq","company","suggestions","interview","results"].indexOf(step) > i
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}>{i + 1}</div>
            {i < 3 && <div className={`h-px w-8 ${["profile","mcq","company","suggestions","interview","results"].indexOf(step) > i ? "bg-emerald-500/40" : "bg-slate-700"}`} />}
          </div>
        ))}
        <span className="text-slate-500 text-xs ml-2">
          {step === "profile" && "Your Profile"}
          {step === "mcq" && "Aptitude Check"}
          {step === "company" && "Target Company"}
          {step === "suggestions" && "AI Suggestions"}
          {step === "interview" && "Virtual Interview"}
          {step === "results" && "Results"}
        </span>
      </div>

      {/* ── STEP: Profile ── */}
      {step === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Interview Prep</h1>
            <p className="text-slate-400 text-sm">Fill in your details to get company-targeted preparation.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Basic Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", name: "name", placeholder: "Jane Doe", required: true },
                { label: "College / University", name: "college", placeholder: "IIT Bombay", required: true },
                { label: "Pass-out Year", name: "passOutYear", placeholder: "2025", required: true },
                { label: "CGPA", name: "cgpa", placeholder: "8.5 / 10", required: true },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {f.label}{f.required && <span className="text-sky-400 ml-1">*</span>}
                  </label>
                  <input
                    type="text" required={f.required} placeholder={f.placeholder}
                    value={(profile as Record<string, string>)[f.name] ?? ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "LinkedIn URL", name: "linkedinUrl", placeholder: "https://linkedin.com/in/..." },
                { label: "GitHub URL", name: "githubUrl", placeholder: "https://github.com/..." },
                { label: "Target Role", name: "targetRole", placeholder: "Software Engineer", required: true },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {f.label}{f.required && <span className="text-sky-400 ml-1">*</span>}
                  </label>
                  <input
                    type="text" required={f.required} placeholder={f.placeholder}
                    value={(profile as Record<string, string>)[f.name] ?? ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Resume upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Resume PDF</h2>
            {!fileName ? (
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${pdfLoading ? "border-sky-500/50 bg-sky-500/5" : "border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5"}`}>
                {pdfLoading ? (
                  <span className="text-sky-400 text-sm">Extracting text...</span>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-300 text-sm font-medium">Click to upload resume PDF</p>
                    <p className="text-slate-500 text-xs mt-1">PDF only · Max 5MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={pdfLoading} />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{fileName}</p>
                  <p className="text-emerald-400 text-xs">✓ Text extracted</p>
                </div>
                <button type="button" onClick={() => { setFileName(""); setResumeText(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-slate-500 hover:text-red-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3.5 rounded-xl transition-colors">
            Continue to Aptitude Check →
          </button>
        </form>
      )}

      {/* ── STEP: MCQ ── */}
      {step === "mcq" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Aptitude Check</h1>
            <p className="text-slate-400 text-sm">5 quick questions to assess your technical baseline.</p>
          </div>

          <div className="space-y-4">
            {MCQ_QUESTIONS.map((q) => (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-white font-medium mb-4 text-sm">
                  <span className="text-sky-400 font-bold mr-2">Q{q.id}.</span>{q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => (
                    <button key={idx} type="button" onClick={() => handleMcqAnswer(q.id, idx)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                        mcqAnswers[q.id] === idx
                          ? "bg-sky-500/10 border-sky-500/40 text-sky-300"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}>
                      <span className="font-medium mr-2 text-slate-500">{String.fromCharCode(65 + idx)}.</span>{opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep("profile")} className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-sm transition-colors">
              ← Back
            </button>
            <button onClick={handleMcqSubmit} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors">
              Continue → ({Object.keys(mcqAnswers).length}/{MCQ_QUESTIONS.length} answered)
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: Company ── */}
      {step === "company" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Target Company</h1>
            <p className="text-slate-400 text-sm">Select the company you're preparing for.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <svg className="animate-spin h-8 w-8 text-sky-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-slate-400 text-sm">Generating company-specific suggestions...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COMPANIES.map((company) => (
                  <button key={company} onClick={() => handleCompanySelect(company)}
                    className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 hover:bg-sky-500/5 text-slate-300 hover:text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left">
                    {company}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={() => setStep("mcq")} className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-sm transition-colors">
                ← Back
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STEP: Suggestions ── */}
      {step === "suggestions" && suggestions && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Prep for {profile.targetCompany}
              </h1>
              <p className="text-slate-400 text-sm">AI-generated suggestions based on your profile.</p>
            </div>
            <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1.5 rounded-full">
              MCQ Score: {mcqScore}/{MCQ_QUESTIONS.length}
            </span>
          </div>

          {/* Resume changes */}
          <SuggestionCard title="📄 Resume Changes" color="sky" items={suggestions.resumeChanges} />
          <SuggestionCard title="💼 LinkedIn Tips" color="blue" items={suggestions.linkedinTips} />
          <SuggestionCard title="🐙 GitHub Tips" color="purple" items={suggestions.githubTips} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SuggestionCard title="🔑 Key Skills to Highlight" color="emerald" items={suggestions.keySkills} />
            <SuggestionCard title="🎯 Interview Focus Areas" color="orange" items={suggestions.interviewFocus} />
          </div>

          {/* Virtual Interview CTA */}
          <div className="bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 rounded-2xl p-6 text-center">
            <h2 className="text-white font-bold text-lg mb-2">Ready for the Virtual Interview?</h2>
            <p className="text-slate-400 text-sm mb-4">
              AI will ask you {questions.length} real interview questions for {profile.targetCompany}.<br />
              Your camera will be on. Posture, eye contact, and answers will be evaluated.
            </p>
            <button onClick={() => setStep("interview")}
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Start Virtual Interview →
            </button>
          </div>

          <button onClick={() => setStep("company")} className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-sm transition-colors">
            ← Change Company
          </button>
        </div>
      )}

      {/* ── STEP: Interview ── */}
      {step === "interview" && questions.length > 0 && (
        <VirtualInterview
          questions={questions}
          company={profile.targetCompany ?? ""}
          onDone={handleInterviewDone}
          onBack={() => setStep("suggestions")}
        />
      )}

      {/* ── STEP: Results ── */}
      {step === "results" && results && (
        <InterviewResults
          feedback={results.feedback}
          postureScore={results.postureScore}
          eyeContactScore={results.eyeContactScore}
          company={profile.targetCompany ?? ""}
          onRestart={() => { setStep("profile"); setResults(null); setSuggestions(null); setMcqAnswers({}); }}
        />
      )}
    </div>
  );
}

function SuggestionCard({ title, color, items }: { title: string; color: string; items: string[] }) {
  const colors: Record<string, string> = {
    sky: "border-sky-500/20 bg-sky-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    orange: "border-orange-500/20 bg-orange-500/5",
  };
  return (
    <div className={`border rounded-2xl p-5 ${colors[color] ?? colors.sky}`}>
      <h3 className="text-white font-semibold text-sm mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-slate-300 text-sm">
            <span className="text-slate-500 mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InterviewResults({ feedback, postureScore, eyeContactScore, company, onRestart }: {
  feedback: AnswerFeedback[];
  postureScore: number;
  eyeContactScore: number;
  company: string;
  onRestart: () => void;
}) {
  const avgAnswerScore = feedback.length > 0
    ? Math.round(feedback.reduce((s, f) => s + f.score, 0) / feedback.length * 10)
    : 0;
  const overall = Math.round((avgAnswerScore + postureScore + eyeContactScore) / 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Interview Results</h1>
        <p className="text-slate-400 text-sm">{company} virtual interview complete.</p>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Overall", value: overall, color: "text-sky-400" },
          { label: "Answers", value: avgAnswerScore, color: "text-emerald-400" },
          { label: "Posture", value: postureScore, color: "text-yellow-400" },
          { label: "Eye Contact", value: eyeContactScore, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label} / 100</div>
          </div>
        ))}
      </div>

      {/* Per-question feedback */}
      <div className="space-y-4">
        <h2 className="text-white font-semibold">Answer Breakdown</h2>
        {feedback.map((f, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-white text-sm font-medium">{f.question}</p>
              <span className={`flex-shrink-0 text-sm font-bold ${f.score >= 7 ? "text-emerald-400" : f.score >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                {f.score}/10
              </span>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 mb-3">
              <p className="text-xs text-slate-500 mb-1">Your answer:</p>
              <p className="text-slate-300 text-sm">{f.userAnswer || "(no answer)"}</p>
            </div>
            <p className="text-slate-400 text-sm">{f.feedback}</p>
            {f.missedPoints.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">Missed key points:</p>
                <ul className="space-y-1">
                  {f.missedPoints.map((p, j) => (
                    <li key={j} className="text-red-400 text-xs flex gap-1.5">
                      <span>•</span><span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onRestart} className="w-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium py-3 rounded-xl transition-colors">
        Start Over
      </button>
    </div>
  );
}
