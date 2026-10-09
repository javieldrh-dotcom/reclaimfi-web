'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { verifyLedgerIntegrity } from "@/app/core/verification-engine";

// Logica compartida entre /dashboard/audit/crypto y
// /dashboard/audit/financiero: cargar los casos de la empresa activa
// (filtrados por tipo), cargar la cadena de custodia (event_ledger) del
// caso seleccionado y verificar su integridad. Antes esto vivia duplicado
// en una sola pagina generica (app/dashboard/audit/page.tsx); se extrae
// aqui para que ambos modulos (cripto / financiero) no diverjan con el
// tiempo.
interface Props {
  title: string;
  // BLOCKCHAIN -> Auditoria Cripto. NOT_BLOCKCHAIN -> Auditoria Financiera
  // (todo lo que no sea BLOCKCHAIN: FINANCIAL, DOCUMENTAL, PROCUREMENT...).
  caseTypeFilter: "BLOCKCHAIN" | "NOT_BLOCKCHAIN";
  showSectorFilter?: boolean;
}

const SECTOR_OPTIONS = ["TODOS", "PETROLERO", "MUNICIPAL", "CORPORATIVO"];

export default function AuditLedgerView({ title, caseTypeFilter, showSectorFilter }: Props) {
  const [cases, setCases] = useState<any[]>([]);
  const [sectorFilter, setSectorFilter] = useState("TODOS");
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

      let query = supabase.from("cases").select("id, case_code, title, case_type, sector").eq("company_id", cid).order("created_at", { ascending: false });
      query = caseTypeFilter === "BLOCKCHAIN" ? query.eq("case_type", "BLOCKCHAIN") : query.neq("case_type", "BLOCKCHAIN");

      const { data: casesList } = await query;
      setCases(casesList ?? []);
    }
    loadCases();
  }, [caseTypeFilter]);

  const visibleCases = showSectorFilter && sectorFilter !== "TODOS"
    ? cases.filter((c) => c.sector === sectorFilter)
    : cases;

  useEffect(() => {
    // Si el caso seleccionado deja de estar en la lista visible (p.ej. por
    // el filtro de sector), se limpia la seleccion en vez de dejar un
    // ledger "huerfano" en pantalla.
    if (selectedCaseId && !visibleCases.some((c) => c.id === selectedCaseId)) {
      setSelectedCaseId("");
    }
  }, [visibleCases, selectedCaseId]);

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
      <h1>{title}</h1>

      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        <label>
          <strong>Caso:</strong>{" "}
          <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            <option value="">Selecciona un caso...</option>
            {visibleCases.map((c: any) => (
              <option key={c.id} value={c.id}>{c.case_code} - {c.title}</option>
            ))}
          </select>
        </label>

        {showSectorFilter && (
          <label>
            <strong>Sector:</strong>{" "}
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
              {SECTOR_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
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