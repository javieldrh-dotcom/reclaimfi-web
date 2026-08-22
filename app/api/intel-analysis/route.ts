import { NextResponse } from "next/server";
import { analyzeInvestigationNotes } from "@/app/core/agents/intelligenceAnalysisAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "intel-analysis", p_max_requests: 15, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const { scenario } = await request.json();
    if (!scenario || !scenario.trim()) {
      return NextResponse.json({ success: false, error: "Falta el texto a analizar." }, { status: 400 });
    }

    const result = await analyzeInvestigationNotes(scenario.trim());
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("INTEL ANALYSIS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}