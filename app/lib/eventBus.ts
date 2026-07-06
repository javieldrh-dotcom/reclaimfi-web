import { eventHandlers } from "@/app/core/eventHandlers";
import { graphEngine } from "./graph/eventGraphEngine";
import { ingestLedgerEvent } from "@/app/core/ledger-engine";
import { createClient } from "@/app/lib/supabase/server";

class EventBus {
  async emit(type: string, payload: any) {
    const event = { type, payload };

    await Promise.all(eventHandlers.map((h) => h(event)));

    graphEngine.ingest(event);

    const serverClient = await createClient();
    ingestLedgerEvent(
      { type, table: "event_bus", operation: "EMIT", payload },
      serverClient
    ).catch((err) => console.error("[EVENTBUS LEDGER ERROR]", err));
  }
}

export const eventBus = new EventBus();
