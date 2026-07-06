"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { graphStore } from "@/app/core/graph/graphStore";
import CustomNode from "@/components/nodes/CustomNode";

export default function GraphVisualization() {
  const nodes = graphStore((s) => s.nodes ?? []);
  const edges = graphStore((s) => s.edges ?? []);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({}), []);

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
