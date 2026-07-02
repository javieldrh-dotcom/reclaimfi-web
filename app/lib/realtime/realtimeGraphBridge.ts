import { supabase } from "@/app/lib/supabase";
import { graphEngine } from "@/app/lib/graph/eventGraphEngine";
import { ingestLedgerEvent } from "@/app/lib/audit/ledger-engine";

let initialized = false;

function getOperation(payload: any) {
  return payload?.eventType || payload?.eventType || "UNKNOWN";
}

export function initializeRealtimeGraphBridge() {
  if (initialized) return;

  initialized = true;

  console.log("REALTIME GRAPH BRIDGE INITIALIZED");

  const channel = supabase.channel("graph-events", {
    config: {
      broadcast: { self: true },
      presence: { key: "audit-global" },
    },
  });

  // =========================
  // ENTITIES
  // =========================
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "entities" },
    (payload) => {
      console.log("[Realtime][entities]", payload);

      const event = {
        type: "rf.entity.created",
        table: "entities",
        operation: getOperation(payload),
        payload: payload?.new,
      };

      ingestLedgerEvent(event).catch(console.error);
      graphEngine.ingest(event);
    }
  );

  // =========================
  // RELATIONSHIPS
  // =========================
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "entity_relationships" },
    (payload) => {
      console.log("[Realtime][entity_relationships]", payload);

      const event = {
        type: "rf.relationship.created",
        table: "entity_relationships",
        operation: getOperation(payload),
        payload: payload?.new,
      };

      ingestLedgerEvent(event).catch(console.error);

      graphEngine.ingest({
        type: event.type,
        payload: {
source: (payload.new as any)?.source_entity,
          target: (payload.new as any)?.target_entity,
          relationship_type: (payload.new as any)?.relationship_type,
          risk_level: (payload.new as any)?.risk_level,
>>>>>>> f51561db2bc00ccdd3809e8c72be8334300599de
        },
      });
    }
  );

  // =========================
  // ALERTS
  // =========================
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "alerts" },
    (payload) => {
      console.log("[Realtime][alerts]", payload);

      const event = {
        type: "rf.alert.created",
        table: "alerts",
        operation: getOperation(payload),
        payload: payload?.new,
      };

      ingestLedgerEvent(event).catch(console.error);
      graphEngine.ingest(event);
    }
  );

  // =========================
  // CASES
  // =========================
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "cases" },
    (payload) => {
      console.log("[Realtime][cases]", payload);

      const event = {
        type: "rf.case.created",
        table: "cases",
        operation: getOperation(payload),
        payload: payload?.new,
      };

      ingestLedgerEvent(event).catch(console.error);
      graphEngine.ingest(event);
    }
  );

  // =========================
  // STATUS
  // =========================
  channel.subscribe((status) => {
    console.log("[Realtime Status]", status, new Date().toISOString());

    if (status === "SUBSCRIBED") {
      console.log("✅ Realtime channel connected");
    }

    if (status === "CHANNEL_ERROR") {
      console.error("❌ Realtime channel error");
    }

    if (status === "TIMED_OUT") {
      console.error("❌ Realtime connection timed out");
    }

    if (status === "CLOSED") {
      console.warn("⚠️ Realtime channel closed");
    }
  });
}