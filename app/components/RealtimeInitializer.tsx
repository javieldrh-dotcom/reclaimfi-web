"use client";
import { useEffect } from "react";
import { initializeRealtimeGraphBridge } from "@/app/lib/realtime/realtimeGraphBridge";
import { getActiveCompanyContext } from "@/app/lib/activeCompany";

export default function RealtimeInitializer() {
  useEffect(() => {
    async function start() {
      const { companyId } = await getActiveCompanyContext();
      initializeRealtimeGraphBridge(companyId);
    }
    start();
  }, []);

  return null;
}