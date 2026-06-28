"use client";

import { useEffect } from "react";
import { initializeRealtimeGraphBridge } from "@/app/lib/realtime/realtimeGraphBridge";

export default function RealtimeInitializer() {
  useEffect(() => {
    initializeRealtimeGraphBridge();
  }, []);

  return null;
}

