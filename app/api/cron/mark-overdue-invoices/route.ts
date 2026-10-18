import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Pasa a OVERDUE cualquier factura de ar_invoices que siga en PENDING con
// due_date ya vencido. El status OVERDUE existia desde siempre en la
// restriccion CHECK de ar_invoices.status y la pantalla de Cuentas por
// Cobrar ya sabia mostrarlo, pero nada en el repositorio lo asignaba
// jamas -- las facturas vencidas se quedaban en PENDING para siempre, sin
// ninguna forma de distinguir "a tiempo" de "vencida" para efectos de
// cobranza. Mismo patron de autorizacion que
// /api/cron/generate-recurring-invoices (Vercel Cron, ver vercel.json).
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
    .from("ar_invoices")
    .update({ status: "OVERDUE" })
    .eq("status", "PENDING")
    .lt("due_date", today)
    .select("id, company_id, invoice_number, customer_name, due_date");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, markedOverdue: (updated ?? []).length, invoices: updated ?? [] });
}
