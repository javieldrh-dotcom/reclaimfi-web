"use client";

import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

import { graphStore } from "@/app/lib/graph/graphStore";
import { nodeTypes, edgeTypes } from "./graphConfig";

export default function GraphVisualization() {
  const nodes = graphStore((s) => s.nodes ?? []);
  const edges = graphStore((s) => s.edges ?? []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}