import { eventHandlers } from "@/app/core/eventHandlers";
import { graphEngine } from "@/app/core/graph/eventGraphEngine";
import { ingestLedgerEvent } from "@/app/core/ledger-engine";

class EventBus {
  async emit(type: string, payload: any) {
    const event = { type, payload };

    await Promise.all(eventHandlers.map((h) => h(event)));

    graphEngine.ingest(event);

    ingestLedgerEvent({ type, table: "event_bus", operation: "EMIT", payload }).catch((err) =>
      console.error("[EVENTBUS LEDGER ERROR]", err)
    );
  }
}

export const eventBus = new EventBus();
