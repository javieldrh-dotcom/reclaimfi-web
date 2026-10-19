import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Pasa a EXPIRED cualquier subscriptions.status='ACTIVE' cuyo expires_at
// ya paso. No es un bug de seguridad -- app/dashboard/layout.tsx ya
// valida expires_at ademas de status al decidir el acceso, asi que una
// empresa vencida ya pierde el acceso real aunque este status siga en
// ACTIVE -- pero sin este cron, el panel de /admin/subscriptions muestra
// esas empresas como "activas" indefinidamente, lo cual es confuso para
// la gestion comercial (no se puede distinguir a simple vista quien
// realmente esta pagando de quien ya vencio).
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
    .from("subscriptions")
    .update({ status: "EXPIRED" })
    .eq("status", "ACTIVE")
    .not("expires_at", "is", null)
    .lt("expires_at", today)
    .select("id, company_id, expires_at");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, markedExpired: (updated ?? []).length, subscriptions: updated ?? [] });
}
