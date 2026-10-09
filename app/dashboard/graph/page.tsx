"use client";

import { useEffect } from "react";
import GraphVisualization from "./GraphVisualization";
import { initializeRealtimeGraphBridge } from "@/app/lib/realtime/realtimeGraphBridge";
import { getActiveCompanyContext } from "@/app/lib/activeCompany";

export default function GraphPage() {
  useEffect(() => {
    async function start() {
      const { companyId } = await getActiveCompanyContext();
      initializeRealtimeGraphBridge(companyId);
    }
    start();
  }, []);

  return (
   <div style={{ padding: 20, height: "calc(100vh - 40px)" }}>
      <h1>FORENSIC GRAPH ENGINE</h1>
      <GraphVisualization />
    </div>
  );
}