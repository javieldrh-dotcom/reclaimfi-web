import { supabase } from "@/app/lib/supabase";
import { graphEngine } from "@/app/lib/graph/eventGraphEngine";

let initialized = false;

export function initializeRealtimeGraphBridge() {
  if (initialized) return;

  initialized = true;

  console.log("REALTIME GRAPH BRIDGE INITIALIZED");

  const channel = supabase.channel("graph-events");

  //
  // ENTITIES
  //
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "entities",
    },
    (payload) => {
      console.log("[Realtime][entities]", payload);

      graphEngine.ingest({
        type: "rf.entity.created",
        payload: payload.new,
      });
    }
  );

  //
  // RELATIONSHIPS
  //
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "entity_relationships",
    },
    (payload) => {
      console.log(
        "[Realtime][entity_relationships]",
        payload
      );

      graphEngine.ingest({
        type: "rf.relationship.created",
        payload: {
          source: (payload.new as any)?.source_entity,
          target: (payload.new as any)?.target_entity,
          relationship_type:
            (payload.new as any)?.relationship_type,
          risk_level:
            (payload.new as any)?.risk_level,
        },
      });
    }
  );

  //
  // ALERTS
  //
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "alerts",
    },
    (payload) => {
      console.log("[Realtime][alerts]", payload);

      graphEngine.ingest({
        type: "rf.alert.created",
        payload: payload.new,
      });
    }
  );

  //
  // CASES
  //
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "cases",
    },
    (payload) => {
      console.log("[Realtime][cases]", payload);

      graphEngine.ingest({
        type: "rf.case.created",
        payload: payload.new,
      });
    }
  );

  //
  // SUBSCRIPTION STATUS
  //
  channel.subscribe((status) => {
    console.log(
      "[Realtime]",
      status,
      new Date().toISOString()
    );

    switch (status) {
      case "SUBSCRIBED":
        console.log(
          "✅ Realtime channel connected"
        );
        break;

      case "CHANNEL_ERROR":
        console.error(
          "❌ Realtime channel error"
        );
        break;

      case "TIMED_OUT":
        console.error(
          "❌ Realtime connection timed out"
        );
        break;

      case "CLOSED":
        console.warn(
          "⚠️ Realtime channel closed"
        );
        break;

      default:
        break;
    }
  });
}