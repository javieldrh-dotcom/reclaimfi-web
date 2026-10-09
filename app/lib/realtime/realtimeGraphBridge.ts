import { supabase } from "@/app/lib/supabase";
import { graphEngine } from "@/app/core/graph/eventGraphEngine";
import { auditHandlerClient } from "@/app/core/eventHandlers/audit-client.handler";

// NOTA DE INTEGRIDAD: este bridge NO debe escribir en event_ledger (la
// cadena de custodia). event_ledger ya se escribe una sola vez, de forma
// confiable, desde el servidor (ver app/lib/eventBus.ts, invocado por
// app/lib/intelligenceOrchestrator.ts) en el momento real en que ocurre el
// evento de negocio. Antes, este archivo tambien llamaba a
// ingestLedgerEvent(...) cada vez que CUALQUIER pestana conectada de la
// empresa recibia el eco de Realtime de ese mismo cambio, duplicando cada
// evento en la cadena y, mas grave, permitiendo que un usuario autenticado
// fabricara entradas de la cadena de custodia desde la consola del
// navegador (el INSERT sobre event_ledger solo exige membresia de empresa,
// no que la escritura venga del servidor). auditHandlerClient(...) sigue
// aqui porque escribe en audit_logs (un registro operativo aparte, no la
// cadena de hashes), y graphEngine.ingest(...) sigue aqui porque solo
// actualiza el grafo en memoria del cliente, no persiste nada.

let initialized = false;

function getOperation(payload: any) {
  return payload?.eventType || payload?.eventType || "UNKNOWN";
}

// ADVERTENCIA DE SEGURIDAD: el parametro `filter` de postgres_changes NO es
// una barrera de seguridad por si solo. Solo reduce lo que ESTE cliente
// recibe cuando se comporta honestamente; cualquiera con las devtools
// abiertas puede volver a suscribirse sin filtro y seguira recibiendo las
// filas de TODAS las empresas si la tabla no tiene Row Level Security (RLS)
// habilitado en la base de datos. El filtrado real y no evitable debe
// imponerse con politicas RLS en Supabase (ver migracion
// 2026-10-08-realtime-rls-isolation.sql); esto de aqui es defensa en
// profundidad y evita que un usuario honesto vea/registre datos de otras
// empresas durante el uso normal de la app.
export function initializeRealtimeGraphBridge(companyId: string | null) {
  if (initialized) return;

  if (!companyId) {
    console.warn("[Realtime] Sin empresa activa: no se inicia el bridge de grafo en tiempo real.");
    return;
  }

  initialized = true;

  console.log("REALTIME GRAPH BRIDGE INITIALIZED", { companyId });

  const channel = supabase.channel("graph-events", {
    config: {
      broadcast: { self: true },
      presence: { key: "audit-global" },
    },
  });

  // entities tiene company_id propio (confirmado contra la base real).
  {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "entities",
        filter: `company_id=eq.${companyId}`,
      },
      (payload) => {
        console.log("[Realtime][entities]", payload);
        const event = {
          type: "rf.entity.created",
          table: "entities",
          operation: getOperation(payload),
          payload: payload?.new,
        };
        auditHandlerClient(event).catch(console.error);
        graphEngine.ingest(event);
      }
    );
  }

  // entity_relationships no tiene company_id ni case_id directo (solo
  // referencia entity ids), por lo que no se puede acotar con un filtro de
  // columna simple en el cliente. Se deshabilita esta suscripcion hasta que
  // exista una politica RLS en la base de datos que la proteja correctamente
  // (ver advertencia arriba); mantenerla activa sin filtro mezclaba el grafo
  // de relaciones de todas las empresas de la plataforma.

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "alerts",
      filter: `company_id=eq.${companyId}`,
    },
    (payload) => {
      console.log("[Realtime][alerts]", payload);
      const event = {
        type: "rf.alert.observed",
        table: "alerts",
        operation: getOperation(payload),
        payload: payload?.new,
      };
      auditHandlerClient(event).catch(console.error);
      graphEngine.ingest(event);
    }
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "cases",
      filter: `company_id=eq.${companyId}`,
    },
    (payload) => {
      console.log("[Realtime][cases]", payload);
      const event = {
        type: "rf.case.observed",
        table: "cases",
        operation: getOperation(payload),
        payload: payload?.new,
      };
      auditHandlerClient(event).catch(console.error);
      graphEngine.ingest(event);
    }
  );

  channel.subscribe((status) => {
    console.log("[Realtime Status]", status, new Date().toISOString());
    if (status === "SUBSCRIBED") {
      console.log("Realtime channel connected");
    }
    if (status === "CHANNEL_ERROR") {
      console.error("Realtime channel closed");
    }
  });
}