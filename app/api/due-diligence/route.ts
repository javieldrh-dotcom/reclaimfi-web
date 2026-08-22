import { NextResponse } from "next/server";
import { performDueDiligence } from "@/app/core/agents/dueDiligenceAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "due-diligence", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const { companyId, entityName, entityType } = await request.json();
    if (!companyId || !entityName || !entityType) {
      return NextResponse.json({ success: false, error: "Faltan datos requeridos." }, { status: 400 });
    }

    const { data: membership } = await supabase.from("user_companies").select("id").eq("user_id", userData.user.id).eq("company_id", companyId).maybeSingle();
    if (!membership) {
      return NextResponse.json({ success: false, error: "No tienes acceso a esta empresa." }, { status: 403 });
    }

    let transactionCount = 0;
    let totalAmount = 0;
    let firstDate: string | null = null;
    let lastDate: string | null = null;

    if (entityType === "PROVEEDOR") {
      const { data: bills } = await supabase.from("ap_bills").select("amount, issue_date").eq("company_id", companyId).eq("vendor_name", entityName).order("issue_date", { ascending: true });
      transactionCount = (bills ?? []).length;
      totalAmount = (bills ?? []).reduce((s: number, b: any) => s + (b.amount || 0), 0);
      firstDate = bills && bills.length > 0 ? bills[0].issue_date : null;
      lastDate = bills && bills.length > 0 ? bills[bills.length - 1].issue_date : null;
    } else {
      const { data: invoices } = await supabase.from("ar_invoices").select("amount, issue_date").eq("company_id", companyId).eq("customer_name", entityName).order("issue_date", { ascending: true });
      transactionCount = (invoices ?? []).length;
      totalAmount = (invoices ?? []).reduce((s: number, b: any) => s + (b.amount || 0), 0);
      firstDate = invoices && invoices.length > 0 ? invoices[0].issue_date : null;
      lastDate = invoices && invoices.length > 0 ? invoices[invoices.length - 1].issue_date : null;
    }

    const result = await performDueDiligence(entityName, entityType, {
      transactionCount,
      totalAmount,
      firstTransactionDate: firstDate,
      lastTransactionDate: lastDate,
    });

    return NextResponse.json({ success: true, result, history: { transactionCount, totalAmount, firstDate, lastDate } });
  } catch (error: any) {
    console.error("DUE DILIGENCE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}