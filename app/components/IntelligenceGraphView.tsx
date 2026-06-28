"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";

import "reactflow/dist/style.css";

import { useGraphStream } from "@/app/lib/graph/useGraphStream";

export default function IntelligenceGraphView() {
  const snapshot = useGraphStream();

  const nodes = useMemo(() => {
    return snapshot.nodes.map(
      (node: any, index: number) => ({
        id: node.id,

        position: {
          x: (index % 5) * 320,
          y: Math.floor(index / 5) * 220,
        },

        data: {
          label: node.label,
        },

        style:
          node.riskLevel === "HIGH"
            ? {
                background: "#450a0a",
                color: "#f87171",
                border: "2px solid #f87171",
                borderRadius: "18px",
                padding: "14px",
                fontWeight: "bold",
                width: 240,
              }
            : node.riskLevel === "MEDIUM"
            ? {
                background: "#422006",
                color: "#facc15",
                border: "2px solid #facc15",
                borderRadius: "18px",
                padding: "14px",
                fontWeight: "bold",
                width: 240,
              }
            : {
                background: "#0f172a",
                color: "#38bdf8",
                border: "2px solid #38bdf8",
                borderRadius: "18px",
                padding: "14px",
                fontWeight: "bold",
                width: 240,
              },
      }));
  }, [snapshot]);

  const edges = useMemo(() => {
    return snapshot.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      style: {
        stroke:
          edge.riskLevel === "HIGH"
            ? "#f87171"
            : edge.riskLevel === "MEDIUM"
            ? "#facc15"
            : "#38bdf8",

        strokeWidth: 3,
      },
    }));
  }, [snapshot]);

  return (
    <div className="h-[900px] w-full overflow-hidden rounded-3xl border border-cyan-500/20 bg-[#020617] shadow-[0_0_50px_rgba(34,211,238,0.08)]">
      {/* HEADER */}
      <div className="border-b border-cyan-500/10 bg-black/40 px-10 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-cyan-300">
              INTELLIGENCE GRAPH
            </h1>

            <p className="mt-4 max-w-4xl text-lg text-gray-400">
              Real-time operational relationship analysis engine
              for AML, financial intelligence, cyber correlation,
              procurement risk, blockchain tracing and
              forensic investigations.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-black/40 px-10 py-8">
            <p className="text-xs tracking-[0.35em] text-cyan-400">
              GRAPH STATUS
            </p>

            <h2 className="mt-4 text-5xl font-black text-cyan-300">
              LIVE
            </h2>

            <p className="mt-4 text-gray-400">
              Nodes: {snapshot.nodes.length}
            </p>

            <p className="text-gray-400">
              Relations: {snapshot.edges.length}
            </p>

            <p className="text-gray-400">
              Events: {snapshot.eventCount}
            </p>
          </div>
        </div>
      </div>

      {/* GRAPH */}
      <div className="h-[760px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

