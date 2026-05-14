export interface CandidateInput {
  name: string;
  college: string;
  passOutYear: string;
  cgpa: string;
  resumeText: string;
  linkedinUrl: string;
  githubUrl: string;
}

export interface RoadmapItem {
  title: string;
  description: string;
}

export interface EvaluationResult {
  score: number;
  category: "Beginner" | "Intermediate" | "Expert";
  summary: string;
  roadmap: RoadmapItem[];
}

export interface EvaluationRecord {
  id: string;
  user_id: string;
  candidate_name: string;
  college: string;
  pass_out_year: string;
  cgpa: string;
  score: number;
  category: string;
  summary: string;
  roadmap: RoadmapItem[];
  created_at: string;
}

// ── Interview Prep ────────────────────────────────────────────────────────────

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // index
}

export interface PrepProfile {
  name: string;
  college: string;
  passOutYear: string;
  cgpa: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeText: string;
  targetCompany: string;
  targetRole: string;
  mcqAnswers: Record<number, number>; // questionId → chosen index
}

export interface CompanySuggestions {
  resumeChanges: string[];
  linkedinTips: string[];
  githubTips: string[];
  keySkills: string[];
  interviewFocus: string[];
}

export interface InterviewQuestion {
  id: number;
  question: string;
  expectedKeyPoints: string[];
  category: string;
}

export interface AnswerFeedback {
  questionId: number;
  question: string;
  userAnswer: string;
  score: number; // 0-10
  feedback: string;
  missedPoints: string[];
}

export interface InterviewResult {
  overallScore: number;
  postureScore: number;
  eyeContactScore: number;
  answerFeedback: AnswerFeedback[];
  summary: string;
  topStrengths: string[];
  improvements: string[];
}
