import { eventHandlers } from "./eventHandlers";
import { graphEngine } from "./graph/eventGraphEngine";

class EventBus {
  async emit(type: string, payload: any) {
    const event = { type, payload };

    // 1. HANDLERS (persistencia)
    await Promise.all(
      eventHandlers.map((h) => h(event))
    );

    // 2. GRAPH ENGINE (proyección en memoria)
    graphEngine.ingest(event);
  }
}

export const eventBus = new EventBus();

