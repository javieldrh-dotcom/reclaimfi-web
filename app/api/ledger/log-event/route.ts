import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { eventBus } from "@/app/lib/eventBus";

// Ruta generica para que el modulo de Auditoria Financiera (creacion de
// casos, evidencia, reconstruccion contable) tambien alimente la cadena de
// custodia (event_ledger), igual que ya lo hace el flujo de cripto via
// app/lib/intelligenceOrchestrator.ts. El cliente YA hizo el insert real
// (cases/evidences/etc) bajo RLS normal con su propia sesion; esta ruta
// SOLO registra el evento en la cadena de custodia - es "fire and log", no
// la operacion principal.
//
// event_ledger solo acepta escritura desde el servidor con service_role
// (ver migracion 2026-10-09-event-ledger-lockdown.sql); eventBus.emit ->
// ingestLedgerEvent ya usa ese cliente privilegiado internamente (ver
// app/core/ledger-engine.ts), asi que esta ruta nunca toca event_ledger
// directamente, solo autentica/autoriza y delega en eventBus.
const ALLOWED_EVENT_TYPES = new Set([
  "rf.case.created",
  "rf.case.status_changed",
  "rf.evidence.uploaded",
  "rf.evidence.deleted",
  "rf.reconstruction.generated",
]);

export async function POST(request: Request) {
  const { type, case_id, payload } = await request.json().catch(() => ({} as any));

  if (!type || !ALLOWED_EVENT_TYPES.has(type)) {
    return NextResponse.json({ success: false, error: "Tipo de evento invalido." }, { status: 400 });
  }
  if (!case_id) {
    return NextResponse.json({ success: false, error: "case_id es requerido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
  }

  // Verificar que el caso pertenece a una empresa del usuario (misma
  // comprobacion de pertenencia que ya usan auditHandler/el dashboard de
  // auditoria), para que nadie pueda inyectar eventos en la cadena de
  // custodia de un caso de otra empresa.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, company_id")
    .eq("id", case_id)
    .maybeSingle();
  if (!caseRow) {
    return NextResponse.json({ success: false, error: "Caso no encontrado." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("user_companies")
    .select("company_id")
    .eq("user_id", userData.user.id)
    .eq("company_id", caseRow.company_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ success: false, error: "No perteneces a la empresa de este caso." }, { status: 403 });
  }

  try {
    await eventBus.emit(type, { ...(payload ?? {}), case_id, actor_user_id: userData.user.id });
  } catch (err: any) {
    console.error("[LOG-EVENT ERROR]", err);
    return NextResponse.json({ success: false, error: "No se pudo registrar el evento." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}