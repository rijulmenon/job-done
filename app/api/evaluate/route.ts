import { NextRequest, NextResponse } from "next/server";
import { evaluateCandidate } from "@/lib/evaluate";
import { createClient } from "@/lib/supabase/server";
import { CandidateInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: CandidateInput = await request.json();

    // Basic validation
    if (!body.name || !body.college || !body.passOutYear || !body.cgpa) {
      return NextResponse.json(
        { error: "Name, college, pass-out year, and CGPA are required." },
        { status: 400 }
      );
    }

    const result = await evaluateCandidate(body);

    // Persist to Supabase if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("evaluations").insert({
        user_id: user.id,
        candidate_name: body.name,
        college: body.college,
        pass_out_year: body.passOutYear,
        cgpa: body.cgpa,
        score: result.score,
        category: result.category,
        summary: result.summary,
        roadmap: result.roadmap,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to evaluate candidate. Please try again.",
      },
      { status: 500 }
    );
  }
}
