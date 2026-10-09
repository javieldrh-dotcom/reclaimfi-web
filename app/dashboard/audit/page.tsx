'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { verifyLedgerIntegrity } from "@/app/core/verification-engine";

export default function AuditDashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [ledger, setLedger] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    async function loadCases() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      if (!cid) return;
      const { data: casesList } = await supabase.from("cases").select("id, case_code, title").eq("company_id", cid).order("created_at", { ascending: false });
      setCases(casesList ?? []);
      if (casesList && casesList.length > 0) setSelectedCaseId(casesList[0].id);
    }
    loadCases();
  }, []);

  useEffect(() => {
    if (!selectedCaseId) {
      setLedger([]);
      setStatus(null);
      setSelected(null);
      return;
    }
    loadLedger(selectedCaseId);
    runVerification(selectedCaseId);
  }, [selectedCaseId]);

  async function loadLedger(caseId: string) {
    const { data } = await supabase
      .from("event_ledger")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    setLedger(data || []);
  }

  async function runVerification(caseId: string) {
    const result = await verifyLedgerIntegrity(caseId);
    setStatus(result);
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>

      {/* HEADER STATUS */}
      <h1>AUDIT CONTROL CENTER</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Caso:</strong>{" "}
          <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            <option value="">Selecciona un caso...</option>
            {cases.map((c: any) => (
              <option key={c.id} value={c.id}>{c.case_code} - {c.title}</option>
            ))}
          </select>
        </label>
      </div>

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