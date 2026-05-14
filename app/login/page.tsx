"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);

  // autoFocus after mount to avoid SSR hydration mismatch
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
      startCooldown();
      // Focus first OTP box after render
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
    setLoading(false);
  }

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setError("Invalid or expired code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      router.push(next);
      router.refresh();
    }
    setLoading(false);
  }

  // ── Resend ────────────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    startCooldown();
  }

  function startCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  // ── OTP input handlers ────────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    // Allow pasting full code into first box
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      digits.forEach((d, i) => { if (i < 6) next[i] = d; });
      setOtp(next);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-sky-400 text-sm hover:underline">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">
            {step === "email" ? "Sign In / Sign Up" : "Check your email"}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === "email"
              ? "Enter your email — we'll send a 6-digit code. No password needed."
              : (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="text-white font-medium">{email}</span>.
                  <br />Enter it below to continue.
                </>
              )}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {step === "email" ? (
            // ── Email step ──────────────────────────────────────────────────
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  ref={emailRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Sending code..." : "Send Code →"}
              </button>
            </form>
          ) : (
            // ── OTP step ────────────────────────────────────────────────────
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6-box OTP input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                  6-digit code
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-14 text-center text-xl font-bold bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition caret-transparent"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>

              {/* Resend + change email */}
              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
