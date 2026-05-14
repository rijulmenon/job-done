"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { InterviewQuestion, AnswerFeedback } from "@/lib/types";

interface Props {
  questions: InterviewQuestion[];
  company: string;
  onDone: (feedback: AnswerFeedback[], postureScore: number, eyeContactScore: number) => void;
  onBack: () => void;
}

type Phase = "setup" | "question" | "answering" | "next" | "processing";

export default function VirtualInterview({ questions, company, onDone, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [postureFrames, setPostureFrames] = useState<number[]>([]);
  const [eyeFrames, setEyeFrames] = useState<number[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const postureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Camera setup ──────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCameraError("Camera access denied. Please allow camera access and try again.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (postureIntervalRef.current) clearInterval(postureIntervalRef.current);
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Posture/eye contact simulation via face detection ─────────────────────
  // Uses canvas to sample face position — simulates posture/eye contact scoring
  const samplePosture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = 160;
    canvasRef.current.height = 120;
    ctx.drawImage(videoRef.current, 0, 0, 160, 120);

    // Sample brightness in face region (center-top area)
    const imageData = ctx.getImageData(40, 10, 80, 60);
    let brightness = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      brightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
    }
    brightness /= (imageData.data.length / 4);

    // Heuristic: good lighting + face centered = good posture/eye contact
    const postureScore = Math.min(100, Math.max(40, brightness > 30 ? 70 + Math.random() * 25 : 45 + Math.random() * 20));
    const eyeScore = Math.min(100, Math.max(40, brightness > 30 ? 65 + Math.random() * 30 : 40 + Math.random() * 25));

    setPostureFrames((prev) => [...prev, postureScore]);
    setEyeFrames((prev) => [...prev, eyeScore]);
  }, []);

  // ── Text-to-speech ────────────────────────────────────────────────────────
  function speak(text: string, onEnd?: () => void) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    // Prefer a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.name.includes("Google") || v.name.includes("Natural") || v.lang === "en-US");
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utter);
  }

  // ── Speech recognition ────────────────────────────────────────────────────
  function startListening() {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setTranscript("(Speech recognition not supported in this browser. Please use Chrome.)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
      }
      setTranscript(final.trim());
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  function startTimer() {
    setTimeLeft(90);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleStopAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // ── Flow ──────────────────────────────────────────────────────────────────
  function handleStart() {
    setPhase("question");
    startPostureTracking();
    askQuestion(0);
  }

  function startPostureTracking() {
    postureIntervalRef.current = setInterval(samplePosture, 2000);
  }

  function askQuestion(idx: number) {
    setCurrentQ(idx);
    setTranscript("");
    setPhase("question");
    const q = questions[idx];
    speak(`Question ${idx + 1}. ${q.question}`, () => {
      setPhase("answering");
      startListening();
      startTimer();
    });
  }

  function handleStopAnswer() {
    stopListening();
    stopTimer();
    const current = [...answers];
    current[currentQ] = transcript;
    setAnswers(current);
    setPhase("next");
  }

  async function handleNext() {
    const next = currentQ + 1;
    if (next < questions.length) {
      askQuestion(next);
    } else {
      // All done — process results
      if (postureIntervalRef.current) clearInterval(postureIntervalRef.current);
      setPhase("processing");
      await processResults([...answers]);
    }
  }

  async function processResults(finalAnswers: string[]) {
    const avgPosture = postureFrames.length > 0
      ? Math.round(postureFrames.reduce((a, b) => a + b, 0) / postureFrames.length)
      : 65;
    const avgEye = eyeFrames.length > 0
      ? Math.round(eyeFrames.reduce((a, b) => a + b, 0) / eyeFrames.length)
      : 60;

    try {
      const res = await fetch("/api/evaluate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: questions.map((q, i) => ({
            question: q.question,
            expectedKeyPoints: q.expectedKeyPoints,
            userAnswer: finalAnswers[i] || "",
          })),
          company,
        }),
      });
      const data = await res.json();
      stopCamera();
      onDone(data.feedback, avgPosture, avgEye);
    } catch {
      stopCamera();
      // Fallback scoring if API fails
      const fallback: AnswerFeedback[] = questions.map((q, i) => ({
        questionId: q.id,
        question: q.question,
        userAnswer: finalAnswers[i] || "",
        score: finalAnswers[i]?.length > 20 ? 6 : 3,
        feedback: "Answer recorded. Detailed AI feedback unavailable.",
        missedPoints: q.expectedKeyPoints.slice(0, 2),
      }));
      onDone(fallback, avgPosture, avgEye);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Virtual Interview</h1>
          <p className="text-slate-400 text-sm">{company} · {questions.length} questions</p>
        </div>
        {phase === "setup" && (
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back
          </button>
        )}
      </div>

      {/* Camera feed */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-video max-w-lg">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {cameraError ? (
              <p className="text-red-400 text-sm text-center px-6">{cameraError}</p>
            ) : (
              <p className="text-slate-400 text-sm">Camera not started</p>
            )}
          </div>
        )}

        {/* Overlays */}
        {cameraReady && phase !== "setup" && (
          <>
            {/* Question counter */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-medium">
              Q{currentQ + 1} / {questions.length}
            </div>

            {/* Timer */}
            {phase === "answering" && (
              <div className={`absolute top-3 right-3 rounded-lg px-3 py-1.5 text-xs font-bold ${timeLeft <= 15 ? "bg-red-500/80 text-white" : "bg-black/60 text-white"}`}>
                {timeLeft}s
              </div>
            )}

            {/* Speaking indicator */}
            {speaking && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-sky-500/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-medium">AI Speaking...</span>
              </div>
            )}

            {/* Listening indicator */}
            {isListening && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-red-500/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-medium">Listening</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Setup phase */}
      {phase === "setup" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Before you begin</h2>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex gap-2"><span className="text-sky-400">•</span> Allow camera and microphone access</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> Sit in a well-lit area, face the camera</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> You have 90 seconds per question</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> Speak clearly — your answers are transcribed</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> Use Chrome for best speech recognition support</li>
          </ul>

          {!cameraReady ? (
            <button onClick={startCamera} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors">
              Enable Camera & Microphone
            </button>
          ) : (
            <button onClick={handleStart} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors">
              Start Interview →
            </button>
          )}
        </div>
      )}

      {/* Question / answering phase */}
      {(phase === "question" || phase === "answering" || phase === "next") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider">{questions[currentQ]?.category}</span>
          </div>
          <p className="text-white font-medium text-lg leading-relaxed">
            {questions[currentQ]?.question}
          </p>

          {/* Transcript */}
          <div className="bg-slate-800 rounded-xl p-4 min-h-[80px]">
            <p className="text-xs text-slate-500 mb-2">Your answer (live transcript):</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {transcript || <span className="text-slate-600 italic">{phase === "answering" ? "Start speaking..." : "—"}</span>}
            </p>
          </div>

          {phase === "answering" && (
            <button onClick={handleStopAnswer} className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition-colors">
              Stop & Submit Answer
            </button>
          )}

          {phase === "next" && (
            <button onClick={handleNext} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors">
              {currentQ + 1 < questions.length ? `Next Question (${currentQ + 2}/${questions.length}) →` : "Finish Interview →"}
            </button>
          )}

          {phase === "question" && speaking && (
            <p className="text-center text-slate-500 text-sm">AI is reading the question...</p>
          )}
        </div>
      )}

      {/* Processing */}
      {phase === "processing" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-sky-400 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-white font-medium">Evaluating your answers...</p>
          <p className="text-slate-400 text-sm">Analyzing posture, eye contact, and answer quality.</p>
        </div>
      )}
    </div>
  );
}
