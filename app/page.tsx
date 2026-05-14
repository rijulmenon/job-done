import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-950">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          AI-Powered Career Analysis
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Know exactly where you{" "}
          <span className="gradient-text">stand</span> before the interview.
        </h1>

        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Paste your resume, drop your links. Get an honest Interview Readiness
          Score and a 30-day roadmap to close the gap — in under 2 minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/evaluate"
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg"
          >
            Get My Score →
          </Link>
          <Link
            href="/login"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Feature pills */}
      <div className="mt-20 flex flex-wrap gap-3 justify-center max-w-2xl">
        {[
          "Score 0–100",
          "Beginner → Expert classification",
          "3-sentence honest summary",
          "30-day action roadmap",
          "History saved to your account",
        ].map((f) => (
          <span
            key={f}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-4 py-2 rounded-full"
          >
            {f}
          </span>
        ))}
      </div>
    </main>
  );
}
