import { graphStore } from "@/app/lib/graph/graphStore";

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
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();
  private eventLog: GraphEvent[] = [];

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
    }
  }

  private addNode(payload: any) {
    const id =
      payload?.id ||
      payload?.case_code ||
      payload?.entity_name;

    if (!id) return;

    const existing = this.nodes.get(id);

    const node: GraphNode = {
      id,
      label:
        payload?.title ||
        payload?.entity_name ||
        payload?.case_code ||
        "Node",
      type: payload?.type || "entity",
      riskLevel:
        payload?.risk_level ||
        existing?.riskLevel ||
        "LOW",
    };

    this.nodes.set(id, node);

    // 🔥 CRÍTICO: sincronización UI
   graphStore.getState().addNode(node); 
  }

  private addEdge(payload: any) {
    if (!payload?.source || !payload?.target) return;

    const source = String(payload.source);
    const target = String(payload.target);

    const id =
      source < target
        ? `${source}-${target}`
        : `${target}-${source}`;

    const edge: GraphEdge = {
      id,
      source,
      target,
      label:
        payload?.label ||
        payload?.relationship_type ||
        "relation",
      riskLevel: payload?.risk_level || "LOW",
    };

    this.edges.set(id, edge);

    // 🔥 CRÍTICO: sincronización UI
   graphStore.getState().addEdge(edge);
  }

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

  private updateRisk(payload: any) {
    if (!payload?.entityId) return;

    const node = this.nodes.get(payload.entityId);
    if (!node) return;

    const updated = {
      ...node,
      riskLevel: payload.riskLevel || "MEDIUM",
    };

    this.nodes.set(payload.entityId, updated);
    graphStore.getState().updateNode(updated);
  }

  public getSnapshot() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      eventCount: this.eventLog.length,
      lastEvent: this.eventLog.at(-1) || null,
      timestamp: Date.now(),
    };
  }

  public reset() {
    this.nodes.clear();
    this.edges.clear();
    this.eventLog = [];
    graphStore.getState().reset();
  }
}

export const graphEngine = new EventGraphEngine();

if (typeof window !== "undefined") {
  (window as any).graphEngine = graphEngine;
}
