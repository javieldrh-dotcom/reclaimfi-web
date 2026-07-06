"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";

import "reactflow/dist/style.css";

import { graphEngine } from "@/app/core/graph/eventGraphEngine";

export default function GraphVisualization() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = graphEngine.getSnapshot();

      // ----------------------------
      // NODES TRANSFORMATION
      // ----------------------------
      const flowNodes: Node[] = snapshot.nodes.map((n, index) => {
        return {
          id: n.id,
          data: {
            label: `${n.label} (${n.riskLevel})`,
          },
          position: {
            x: (index % 5) * 220,
            y: Math.floor(index / 5) * 120,
          },
          style: {
            padding: 10,
            borderRadius: 8,
            border: "1px solid #999",
            background:
              n.riskLevel === "HIGH"
                ? "#ffdddd"
                : n.riskLevel === "MEDIUM"
                ? "#fff6d6"
                : "#e8f5e9",
          },
        };
      });

      // ----------------------------
      // EDGES TRANSFORMATION
      // ----------------------------
      const flowEdges: Edge[] = snapshot.edges.map((e) => {
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: e.riskLevel === "HIGH",
          style: {
            stroke:
              e.riskLevel === "HIGH"
                ? "#ff4d4f"
                : e.riskLevel === "MEDIUM"
                ? "#faad14"
                : "#52c41a",
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    }, 1000); // refresh cada 1s

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "80vh",
        border: "1px solid #ddd",
        borderRadius: 12,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
