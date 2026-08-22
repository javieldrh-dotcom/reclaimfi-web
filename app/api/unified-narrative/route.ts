import { NextResponse } from "next/server";
import { generateUnifiedNarrative } from "@/app/core/agents/unifiedNarrativeAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const { caseId } = await request.json();
    if (!caseId) {
      return NextResponse.json({ success: false, error: "Falta el ID del caso." }, { status: 400 });
    }

    const { data: caseData } = await supabase.from("cases").select("*").eq("id", caseId).single();
    if (!caseData) {
      return NextResponse.json({ success: false, error: "Caso no encontrado." }, { status: 404 });
    }

    const { data: reconstructionCompany } = await supabase.from("companies").select("id").eq("reconstruction_case_id", caseId).maybeSingle();

    let documentaryFindings = "";
    if (reconstructionCompany) {
      const { data: entries } = await supabase
        .from("journal_entries")
        .select("description, entry_date, journal_lines(debit, credit, chart_of_accounts(account_name))")
        .eq("company_id", reconstructionCompany.id)
        .order("entry_date", { ascending: true })
        .limit(50);

      documentaryFindings = (entries ?? [])
        .map((e: any) => {
          const total = (e.journal_lines ?? []).reduce((s: number, l: any) => s + (l.debit || 0), 0);
          return "- " + e.entry_date + ": " + e.description + " (Monto: $" + total.toLocaleString() + ")";
        })
        .join("\n");
    }

    const { data: walletAnalyses } = await supabase
      .from("case_wallet_analyses")
      .select("wallet_address, risk_level, ofac_sanctioned, analysis_summary")
      .eq("case_id", caseId);

    const narrative = await generateUnifiedNarrative({
      caseTitle: caseData.title ?? caseData.case_code,
      caseDescription: caseData.description ?? "",
      documentaryFindings,
      walletAnalyses: (walletAnalyses ?? []).map((w: any) => ({
        address: w.wallet_address,
        riskLevel: w.risk_level,
        ofacSanctioned: w.ofac_sanctioned,
        summary: w.analysis_summary,
      })),
    });

    return NextResponse.json({ success: true, narrative });
  } catch (error: any) {
    console.error("UNIFIED NARRATIVE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}