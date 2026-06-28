//
// EVENT GRAPH ENGINE (STABLE PRODUCTION CORE)
//

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

type GraphNode = {
  id: string;
  label: string;
  type?: string;
  riskLevel?: RiskLevel;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  riskLevel?: RiskLevel;
};

type GraphEvent = {
  type: string;
  payload: any;
  timestamp: number;
};

class EventGraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private eventLog: GraphEvent[] = [];

  //
  // EVENT INTAKE
  //
  public ingest(event: any) {
    if (!event?.type) return;

    this.eventLog.push({
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp || Date.now(),
    });

    switch (event.type) {
      case "rf.alert.created":
      case "rf.case.created":
      case "rf.entity.created":
        this.addNode(event.payload);
        break;

      case "rf.relationship.created":
        this.addEdge(event.payload);
        break;

      case "rf.entity.batch":
        this.processBatch(event.payload?.entities || []);
        break;

      case "rf.risk.calculated":
        this.updateRisk(event.payload);
        break;

      default:
        break;
    }
  }

  //
  // NODE CREATION (IDEMPOTENT)
  //
  private addNode(payload: any) {
    const id =
      payload?.id ||
      payload?.case_code ||
      payload?.entity_name;

    if (!id) return;

    const existing = this.nodes.get(id);

    this.nodes.set(id, {
      id,
      label:
        payload?.title ||
        payload?.entity_name ||
        payload?.case_code ||
        "Node",
      type: payload?.type || "entity",
      riskLevel: payload?.risk_level || existing?.riskLevel || "LOW",
    });
  }

  //
  // EDGE CREATION (NORMALIZED + NO DUPLICATES)
  //
  private addEdge(payload: any) {
    if (!payload?.source || !payload?.target) return;

    const source = String(payload.source);
    const target = String(payload.target);

    const id =
      source < target
        ? `${source}-${target}`
        : `${target}-${source}`;

    this.edges.set(id, {
      id,
      source,
      target,
      label: payload?.label || payload?.relationship_type || "relation",
      riskLevel: payload?.risk_level || "LOW",
    });
  }

  //
  // BATCH PROCESSING
  //
  private processBatch(entities: any[]) {
    if (!Array.isArray(entities)) return;

    for (const entity of entities) {
      this.addNode({
        id: entity?.id,
        entity_name: entity?.entity,
        title: entity?.entity,
        type: entity?.type,
        risk_level: entity?.risk_level,
      });
    }
  }

  //
  // RISK UPDATE (IMMUTABLE FIX)
  //
  private updateRisk(payload: any) {
    if (!payload?.entityId) return;

    const node = this.nodes.get(payload.entityId);

    if (!node) return;

    this.nodes.set(payload.entityId, {
      ...node,
      riskLevel: payload.riskLevel || "MEDIUM",
    });
  }

  //
  // SNAPSHOT FOR UI (REACTFLOW)
  //
  public getSnapshot() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      eventCount: this.eventLog.length,
      lastEvent: this.eventLog[this.eventLog.length - 1] || null,
      timestamp: Date.now(),
    };
  }

  //
  // RESET (DEBUG ONLY)
  //
  public reset() {
    this.nodes.clear();
    this.edges.clear();
    this.eventLog = [];
  }
}

export const graphEngine = new EventGraphEngine();

if (typeof window !== "undefined") {
  (window as any).graphEngine = graphEngine;
}

