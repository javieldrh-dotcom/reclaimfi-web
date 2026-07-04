"use client";

import { useEffect } from "react";
import GraphVisualization from "./GraphVisualization";
import { initializeRealtimeGraphBridge } from "@/app/lib/realtime/realtimeGraphBridge";

export default function GraphPage() {
  useEffect(() => {
    initializeRealtimeGraphBridge();
  }, []);

  return (
   <div style={{ padding: 20, height: "calc(100vh - 40px)" }}>
      <h1>FORENSIC GRAPH ENGINE</h1>
      <GraphVisualization />
    </div>
  );
}