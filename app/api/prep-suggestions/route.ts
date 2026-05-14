import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, college, passOutYear, cgpa, linkedinUrl, githubUrl, resumeText, targetCompany, targetRole, mcqAnswers } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured.");

    const mcqScore = Object.values(mcqAnswers ?? {}).length;

    const prompt = `You are a senior technical recruiter at ${targetCompany}. A candidate is preparing to interview for a ${targetRole || "Software Engineer"} role.

CANDIDATE PROFILE:
- Name: ${name}
- College: ${college}
- Pass-out Year: ${passOutYear}
- CGPA: ${cgpa}
- LinkedIn: ${linkedinUrl || "Not provided"}
- GitHub: ${githubUrl || "Not provided"}
- MCQ Score: ${mcqScore}/5
- Resume Text: ${resumeText?.slice(0, 1500) || "Not provided"}

YOUR TASK:
1. Give 4 specific resume changes to make it ${targetCompany}-ready.
2. Give 3 LinkedIn profile improvements.
3. Give 3 GitHub profile improvements.
4. List 5 key skills ${targetCompany} looks for in ${targetRole || "SWE"} interviews.
5. List 4 interview focus areas specific to ${targetCompany}.
6. Generate exactly 5 real interview questions ${targetCompany} commonly asks for ${targetRole || "SWE"} roles. For each question, provide 3-4 expected key points in the answer.

Respond ONLY with valid raw JSON:
{
  "suggestions": {
    "resumeChanges": ["...", "...", "...", "..."],
    "linkedinTips": ["...", "...", "..."],
    "githubTips": ["...", "...", "..."],
    "keySkills": ["...", "...", "...", "...", "..."],
    "interviewFocus": ["...", "...", "...", "..."]
  },
  "questions": [
    { "id": 1, "question": "...", "expectedKeyPoints": ["...", "...", "..."], "category": "..." },
    { "id": 2, "question": "...", "expectedKeyPoints": ["...", "...", "..."], "category": "..." },
    { "id": 3, "question": "...", "expectedKeyPoints": ["...", "...", "..."], "category": "..." },
    { "id": 4, "question": "...", "expectedKeyPoints": ["...", "...", "..."], "category": "..." },
    { "id": 5, "question": "...", "expectedKeyPoints": ["...", "...", "..."], "category": "..." }
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
          { role: "system", content: "You are a technical recruiter. Respond with valid raw JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
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

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Prep suggestions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions." },
      { status: 500 }
    );
  }
}
