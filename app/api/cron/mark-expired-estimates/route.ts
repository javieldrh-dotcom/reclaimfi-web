import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Pasa a EXPIRED cualquier cotizacion de venta (sales_estimates) que siga
// en DRAFT o SENT con expiry_date ya vencido. Mismo patron exacto que
// mark-overdue-invoices / mark-overdue-bills: el valor "EXPIRED" ya
// existia en el CHECK constraint y la pantalla (STATUS_FLOW/STATUS_LABEL
// en app/accounting/sales-estimates/page.tsx) ya lo maneja correctamente
// como estado terminal -- pero nada en el repositorio lo asignaba jamas,
// asi que una cotizacion vencida se quedaba mostrando los botones de
// Aceptar/Rechazar indefinidamente.
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
    .from("sales_estimates")
    .update({ status: "EXPIRED" })
    .in("status", ["DRAFT", "SENT"])
    .not("expiry_date", "is", null)
    .lt("expiry_date", today)
    .select("id, company_id, estimate_number, customer_name, expiry_date");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, markedExpired: (updated ?? []).length, estimates: updated ?? [] });
}