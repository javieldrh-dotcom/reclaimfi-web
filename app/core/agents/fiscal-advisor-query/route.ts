import { NextResponse } from "next/server";
import { answerFiscalQuestion } from "@/app/core/agents/fiscalAdvisorAgent";
import { fetchIncomeTaxConfig, fetchLaborCostFormulaConfig, fetchPayrollChargesConfig } from "@/app/lib/jurisdictionTax";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "fiscal-advisor-query", p_max_requests: 20, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas preguntas seguidas. Espera un momento antes de continuar (maximo 20 por minuto)." }, { status: 429 });
    }

    const { question } = await request.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ success: false, error: "Falta la pregunta." }, { status: 400 });
    }

    const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
    const cid = uc?.company_id;
    if (!cid) {
      return NextResponse.json({ success: false, error: "No se encontro una empresa activa." }, { status: 400 });
    }

    const { data: companyData } = await supabase.from("companies").select("name, jurisdiction_code").eq("id", cid).single();
    const jurisdictionCode = companyData?.jurisdiction_code || "VE";

    // Mismos helpers que ya usan ISLR, FSCL y nomina para leer
    // jurisdiction_modules -- la respuesta del asesor queda anclada a lo
    // que esos modulos realmente tienen cargado para esta empresa, no a
    // una suposicion aparte.
    const [incomeTaxConfig, laborCostFormulaConfig, payrollChargesConfig] = await Promise.all([
      fetchIncomeTaxConfig(supabase, jurisdictionCode),
      fetchLaborCostFormulaConfig(supabase, jurisdictionCode),
      fetchPayrollChargesConfig(supabase, jurisdictionCode),
    ]);

    const answer = await answerFiscalQuestion(
      {
        companyName: companyData?.name ?? "",
        jurisdictionCode,
        incomeTaxConfig,
        laborCostFormulaConfig,
        payrollChargesConfig,
      },
      question
    );

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error("FISCAL ADVISOR QUERY ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}