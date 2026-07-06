import { graphEngine } from "@/app/core/graph/eventGraphEngine";

export function getGraphSnapshot() {
  return graphEngine.getSnapshot();
}

