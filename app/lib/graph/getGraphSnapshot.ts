import { graphEngine } from "@/app/lib/graph/eventGraphEngine";

export function getGraphSnapshot() {
  return graphEngine.getSnapshot();
}

