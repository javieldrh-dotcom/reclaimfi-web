import { graphEngine } from "../graph/eventGraphEngine";

//
// GRAPH EVENT TYPE (CONTRATO)
//
export interface GraphEvent {
  type: string;
  payload: any;
  timestamp?: number;
}

//
// HANDLER PRINCIPAL
// (NO STATE, SOLO PIPELINE)
//
export function graphHandler(event: GraphEvent) {
  if (!event?.type || !event.type.startsWith("rf.")) return;

  graphEngine.ingest({
    type: event.type,
    payload: event.payload,
    timestamp: event.timestamp ?? Date.now(),
  });
}

