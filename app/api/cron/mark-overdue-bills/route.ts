import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Pasa a OVERDUE cualquier factura de ap_bills que siga en PENDING con
// due_date ya vencido. Espejo exacto de /api/cron/mark-overdue-invoices
// pero del lado de Cuentas por Pagar. Mismo patron de autorizacion
// (Vercel Cron, ver vercel.json).
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === "Bearer " + secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: updated, error } = await serviceClient
    .from("ap_bills")
    .update({ status: "OVERDUE" })
    .eq("status", "PENDING")
    .lt("due_date", today)
    .select("id, company_id, bill_number, vendor_name, due_date");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, markedOverdue: (updated ?? []).length, bills: updated ?? [] });
}
