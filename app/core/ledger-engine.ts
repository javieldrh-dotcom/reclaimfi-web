import { createEventHash } from "./hash-engine";
import { createLedgerServiceClient } from "@/app/lib/supabase/serviceClient";

// La cadena de custodia debe ser propia de cada caso (y por lo tanto de la
// empresa duena de ese caso), y debe sobrevivir reinicios del servidor y
// multiples pestanas/instancias escribiendo a la vez. Antes, previous_hash
// se tomaba de una variable `lastHash` en memoria del proceso: esto
// mezclaba todos los casos y empresas en una sola cadena global, y esa
// cadena se "rompia" en cada reinicio o pestana nueva (lastHash volvia a
// null aunque la tabla ya tuviera historial real). Ahora se consulta en la
// base de datos cual fue el ultimo evento real de este case_id, para que
// la cadena quede correctamente persistida por caso sin depender de quien
// la escriba.
//
// Esta funcion SOLO debe invocarse desde codigo de servidor (actualmente,
// unicamente desde app/lib/eventBus.ts). Siempre usa el cliente privilegiado
// (service_role) para leer el ultimo evento y escribir el nuevo, ignorando
// cualquier cliente que antes se le pasara por parametro: event_ledger ya
// no acepta INSERT directo del rol "authenticated" (ver migracion
// 2026-10-09-event-ledger-lockdown.sql), asi que un cliente normal (anon +
// sesion de usuario) ya no podria escribir aqui de todas formas.
export async function ingestLedgerEvent(event: any) {
  const client = createLedgerServiceClient();

  const caseId =
    event.payload?.case_id ??
    event.payload?.caseId ??
    (event.table === "cases" || event.type === "rf.case.created" ? event.payload?.id : null) ??
    null;

  let previousHash: string | null = null;
  if (caseId) {
    const { data: lastEvent } = await client
      .from("event_ledger")
      .select("event_hash")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    previousHash = lastEvent?.event_hash ?? null;
  }

  const eventHash = createEventHash(event, previousHash);

  const record = {
    id: crypto.randomUUID(),
    event_type: event.type,
    table_source: event.table,
    operation: event.operation ?? "UNKNOWN",
    payload: event.payload,
    event_hash: eventHash,
    previous_hash: previousHash,
    actor: event.actor ?? "system",
    session_id: event.sessionId ?? null,
    case_id: caseId,
  };

  const { error } = await client.from("event_ledger").insert(record);

  if (error) {
    console.error("[LEDGER ERROR]", error);
    throw error;
  }

  console.log("[LEDGER STORED]", record.id);
  return record;
}