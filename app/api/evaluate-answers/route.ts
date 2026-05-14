import { NextRequest, NextResponse } from "next/server";
import { AnswerFeedback } from "@/lib/types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    const { questions, company } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured.");

    const prompt = `You are a senior interviewer at ${company}. Evaluate the following interview answers.

For each answer, score it 0-10 and provide specific feedback.

${questions.map((q: { question: string; expectedKeyPoints: string[]; userAnswer: string }, i: number) => `
QUESTION ${i + 1}: ${q.question}
EXPECTED KEY POINTS: ${q.expectedKeyPoints.join(", ")}
CANDIDATE ANSWER: ${q.userAnswer || "(no answer given)"}
`).join("\n")}

Respond ONLY with valid raw JSON:
{
  "feedback": [
    {
      "questionId": 1,
      "question": "...",
      "userAnswer": "...",
      "score": <0-10>,
      "feedback": "<2-3 sentence specific feedback>",
      "missedPoints": ["<missed key point>", ...]
    }
  ]
}`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a technical interviewer. Respond with valid raw JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${err}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

    // Ensure questionId and question fields are populated
    const feedback: AnswerFeedback[] = parsed.feedback.map((f: AnswerFeedback, i: number) => ({
      ...f,
      questionId: f.questionId ?? i + 1,
      question: f.question || questions[i]?.question || "",
      userAnswer: f.userAnswer || questions[i]?.userAnswer || "",
    }));

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Answer evaluation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to evaluate answers." },
      { status: 500 }
    );
  }
}
