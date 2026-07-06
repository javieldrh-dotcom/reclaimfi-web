"use client";

import { useEffect, useState } from "react";
import { graphEngine } from "./eventGraphEngine";

export function useGraphStream() {
  const [snapshot, setSnapshot] = useState(
    graphEngine.getSnapshot()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshot(graphEngine.getSnapshot());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return snapshot;
}

