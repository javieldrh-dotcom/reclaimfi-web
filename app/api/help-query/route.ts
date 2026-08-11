import { NextResponse } from "next/server";
import { answerHelpQuestion } from "@/app/core/agents/helpAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "help-query", p_max_requests: 20, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas preguntas seguidas. Espera un momento." }, { status: 429 });
    }
    const { question } = await request.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ success: false, error: "Falta la pregunta." }, { status: 400 });
    }
    const answer = await answerHelpQuestion(question);
    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error("HELP QUERY ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}