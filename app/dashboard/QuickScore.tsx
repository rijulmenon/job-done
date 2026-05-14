"use client";

import { useState, useRef } from "react";
import { CandidateInput, EvaluationResult } from "@/lib/types";
import ScoreCard from "@/components/ScoreCard";

const defaultForm = {
  name: "", college: "", passOutYear: "", cgpa: "",
  linkedinUrl: "", githubUrl: "",
};

export default function QuickScore() {
  const [form, setForm] = useState(defaultForm);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfError(""); setPdfLoading(true); setFileName(file.name); setResumeText("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse PDF.");
      setResumeText(data.text);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Failed to parse PDF.");
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setPdfLoading(false);
    }
  }

  function handleRemoveFile() {
    setFileName(""); setResumeText(""); setPdfError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText) { setError("Please upload your resume PDF first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const payload: CandidateInput = { ...form, resumeText };
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null); setForm(defaultForm); setResumeText(""); setFileName(""); setPdfError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Your Score</h1>
          <button onClick={handleReset} className="text-sm text-sky-400 hover:underline">
            ← Evaluate again
          </button>
        </div>
        <ScoreCard result={result} candidateName={form.name} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Quick Score</h1>
      <p className="text-slate-400 text-sm mb-6">
        Get your Interview Readiness Score in under 2 minutes.
      </p>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required />
            <Field label="College / University" name="college" value={form.college} onChange={handleChange} placeholder="IIT Bombay" required />
            <Field label="Pass-out Year" name="passOutYear" value={form.passOutYear} onChange={handleChange} placeholder="2025" required />
            <Field label="CGPA" name="cgpa" value={form.cgpa} onChange={handleChange} placeholder="8.5 / 10" required />
          </div>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Profile Links</h2>
          <div className="space-y-4">
            <Field label="LinkedIn URL" name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/janedoe" />
            <Field label="GitHub URL" name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/janedoe" />
          </div>
        </div>

        {/* Resume */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Resume</h2>
          {!fileName ? (
            <label htmlFor="resume-upload-qs" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${pdfLoading ? "border-sky-500/50 bg-sky-500/5" : "border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5"}`}>
              {pdfLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-sky-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sky-400 text-sm">Extracting text...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-slate-300 text-sm font-medium">Click to upload resume PDF</span>
                  <span className="text-slate-500 text-xs">PDF only · Max 5MB</span>
                </div>
              )}
              <input id="resume-upload-qs" ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={pdfLoading} />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="w-5 h-5 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{fileName}</p>
                  <p className="text-emerald-400 text-xs">✓ Text extracted</p>
                </div>
              </div>
              <button type="button" onClick={handleRemoveFile} className="text-slate-500 hover:text-red-400 transition-colors ml-3 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {pdfError && <p className="mt-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{pdfError}</p>}
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading || pdfLoading || !resumeText} className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing...
            </span>
          ) : "Get My Score →"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, required }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`qs-${name}`} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-sky-400 ml-1">*</span>}
      </label>
      <input id={`qs-${name}`} name={name} type="text" value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm" />
    </div>
  );
}
