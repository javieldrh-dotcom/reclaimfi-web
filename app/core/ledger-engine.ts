import { createEventHash } from "./hash-engine";

let lastHash: string | null = null;

export async function ingestLedgerEvent(event: any, supabaseClient?: any) {
  const eventHash = createEventHash(event, lastHash);

  const caseId =
    event.payload?.case_id ??
    event.payload?.caseId ??
    (event.table === "cases" || event.type === "rf.case.created" ? event.payload?.id : null) ??
    null;

  const record = {
    id: crypto.randomUUID(),
    event_type: event.type,
    table_source: event.table,
    operation: event.operation ?? "UNKNOWN",
    payload: event.payload,
    event_hash: eventHash,
    previous_hash: lastHash,
    actor: event.actor ?? "system",
    session_id: event.sessionId ?? null,
    case_id: caseId,
  };

  let client = supabaseClient;
  if (!client) {
    const { supabase } = await import("@/app/lib/supabase");
    client = supabase;
  }

  const { error } = await client.from("event_ledger").insert(record);

  if (error) {
    console.error("[LEDGER ERROR]", error);
    throw error;
  }

  lastHash = eventHash;
  console.log("[LEDGER STORED]", record.id);
  return record;
}