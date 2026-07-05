"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { generateForensicReport } from "@/app/lib/reports/generateForensicReport";

export default function CaseReportPage() {
  const params = useParams();
  const caseId = params?.caseId as string;

  const [caseData, setCaseData] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: caseResult, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (caseError || !caseResult) {
        setError("No se encontro el caso solicitado.");
        setLoading(false);
        return;
      }

      setCaseData(caseResult);

      const { data: ledgerResult } = await supabase
        .from("event_ledger")
        .select("event_type, event_hash, previous_hash, actor, created_at")
        .order("created_at", { ascending: true });

      const { data: auditResult } = await supabase
        .from("audit_logs")
        .select("module, action, created_at")
        .order("created_at", { ascending: true });

      setLedgerEntries(ledgerResult ?? []);
      setAuditEntries(auditResult ?? []);
      setLoading(false);
    }

    if (caseId) loadData();
  }, [caseId]);

  function handleDownload() {
    if (!caseData) return;
    const doc = generateForensicReport(caseData, ledgerEntries, auditEntries);
    doc.save(`reporte-forense-${caseData.case_code}.pdf`);
  }

  if (loading) {
    return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando caso...</div>;
  }

  if (error || !caseData) {
    return <div style={{ padding: 40, color: "#f87171" }}>{error}</div>;
  }

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>
        Reporte Forense - {caseData.case_code}
      </h1>

      <div style={{ marginTop: 20, lineHeight: 1.8 }}>
        <p><strong>Titulo:</strong> {caseData.title ?? "N/D"}</p>
        <p><strong>Nivel de riesgo:</strong> {caseData.risk_level ?? "N/D"}</p>
        <p><strong>Estado:</strong> {caseData.status ?? "N/D"}</p>
        <p><strong>Eventos en cadena de custodia:</strong> {ledgerEntries.length}</p>
        <p><strong>Registros de auditoria:</strong> {auditEntries.length}</p>
      </div>

      <button
        onClick={handleDownload}
        style={{
          marginTop: 30,
          padding: "14px 28px",
          background: "#22d3ee",
          color: "black",
          fontWeight: 900,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
        }}
      >
        DESCARGAR REPORTE PDF
      </button>
    </div>
  );
}