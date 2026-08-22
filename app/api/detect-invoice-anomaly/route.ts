import { NextResponse } from "next/server";
import { detectInvoiceAnomaly } from "@/app/core/agents/invoiceAnomalyAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const { companyId, vendorName, billNumber, issueDate, amount } = await request.json();
    if (!companyId || !vendorName || !billNumber || !issueDate || amount === undefined) {
      return NextResponse.json({ success: false, error: "Faltan datos requeridos." }, { status: 400 });
    }

    const { data: membership } = await supabase.from("user_companies").select("id").eq("user_id", userData.user.id).eq("company_id", companyId).maybeSingle();
    if (!membership) {
      return NextResponse.json({ success: false, error: "No tienes acceso a esta empresa." }, { status: 403 });
    }

    const { data: historicalBills } = await supabase
      .from("ap_bills")
      .select("bill_number, issue_date, amount")
      .eq("company_id", companyId)
      .eq("vendor_name", vendorName)
      .order("issue_date", { ascending: false })
      .limit(20);

    const result = await detectInvoiceAnomaly(vendorName, billNumber, issueDate, amount, historicalBills ?? []);

    return NextResponse.json({ success: true, result, historicalCount: (historicalBills ?? []).length });
  } catch (error: any) {
    console.error("DETECT INVOICE ANOMALY ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}