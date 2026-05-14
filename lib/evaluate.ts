import { CandidateInput, EvaluationResult } from "./types";

// Groq — free tier, no credit card needed
// Get your free key at: https://console.groq.com
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildPrompt(input: CandidateInput): string {
  return `You are an elite Technical Recruiter and Career Strategist. Evaluate the following candidate profile and return a structured JSON response.

CANDIDATE PROFILE:
- Name: ${input.name}
- College: ${input.college}
- Pass-out Year: ${input.passOutYear}
- CGPA: ${input.cgpa}
- LinkedIn: ${input.linkedinUrl || "Not provided"}
- GitHub: ${input.githubUrl || "Not provided"}
- Resume Text:
${input.resumeText || "Not provided"}

YOUR TASK:
1. Calculate an Interview Readiness Score (0-100). A 100 is FAANG-ready. A 50 has basics but no projects or professional presence.
2. Categorize as: Beginner (0-40), Intermediate (41-70), or Expert (71-100).
3. Write a 3-sentence summary of their current standing. Be direct and insightful.
4. Provide exactly 3 specific, high-impact actionable items they can complete in 30 days to increase their score. Be specific — reference actual details from their profile (e.g., repo names, resume bullet points). If GitHub is empty or not provided, flag it as a red flag.

RULES:
- Be objective and professional. No fluff.
- If GitHub is empty or missing, explicitly call it out as a red flag in the roadmap.
- Quantify impact where possible.
- Return ONLY raw JSON with no markdown, no code fences, no explanation.

Required JSON format:
{
  "score": <number 0-100>,
  "category": "<Beginner|Intermediate|Expert>",
  "summary": "<3-sentence summary>",
  "roadmap": [
    { "title": "<short action title>", "description": "<specific actionable description>" },
    { "title": "<short action title>", "description": "<specific actionable description>" },
    { "title": "<short action title>", "description": "<specific actionable description>" }
  ]
}`;
}

export async function evaluateCandidate(
  input: CandidateInput
): Promise<EvaluationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is not configured. Get a free key at https://console.groq.com"
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a technical recruiter. You always respond with valid raw JSON only — no markdown, no code fences, no extra text.",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? "";

  if (!rawText) {
    throw new Error("Empty response from Groq API.");
  }

  // Strip markdown fences just in case
  let jsonText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Extract the first complete JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  let parsed: EvaluationResult;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse Groq response:", jsonText);
    throw new Error("The AI returned an invalid response. Please try again.");
  }

  return parsed;
}
