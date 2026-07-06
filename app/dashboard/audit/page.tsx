'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { verifyLedgerIntegrity } from "@/app/core/verification-engine";

export default function AuditDashboardPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    loadLedger();
    runVerification();
  }, []);

  async function loadLedger() {
    const { data } = await supabase
      .from("event_ledger")
      .select("*")
      .order("created_at", { ascending: false });

    setLedger(data || []);
  }

  async function runVerification() {
    const result = await verifyLedgerIntegrity();
    setStatus(result);
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      
      {/* HEADER STATUS */}
      <h1>AUDIT CONTROL CENTER</h1>

      <div style={{ marginBottom: 20 }}>
        <strong>Status:</strong>{" "}
        <span style={{ color: status?.valid ? "green" : "red" }}>
          {status?.message}
        </span>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: "flex", gap: 20 }}>

        {/* LEDGER LIST */}
        <div style={{ width: "40%", borderRight: "1px solid #ccc" }}>
          <h3>Event Ledger</h3>

          {ledger.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              style={{
                padding: 10,
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              <div><strong>{item.event_type}</strong></div>
              <div style={{ fontSize: 12, color: "gray" }}>
                {item.id}
              </div>
            </div>
          ))}
        </div>

        {/* DETAILS PANEL */}
        <div style={{ width: "60%", padding: 10 }}>
          <h3>Inspector</h3>

          {selected ? (
            <pre style={{ fontSize: 12 }}>
              {JSON.stringify(selected, null, 2)}
            </pre>
          ) : (
            <p>Select an event</p>
          )}
        </div>
      </div>
    </div>
  );
}
