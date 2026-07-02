import { supabase } from "@/app/lib/supabase/client";
import { createEventHash } from "./hash-engine";

let lastHash: string | null = null;

export async function ingestLedgerEvent(event: any) {
  const eventHash = createEventHash(event, lastHash);

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
  };

  const { error } = await supabase
    .from("event_ledger")
    .insert(record);

  if (error) {
    console.error("[LEDGER ERROR]", error);
    throw error;
  }

  lastHash = eventHash;

  console.log("[LEDGER STORED]", record.id);

  return record;
}