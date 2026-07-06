"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { generateForensicReport, EngagementType } from "@/app/lib/reports/generateForensicReport";

export default function CaseReportPage() {
  const params = useParams();
  const caseId = params?.caseId as string;

  const [caseData, setCaseData] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [engagementType, setEngagementType] = useState<EngagementType>("COMPILATION");
  const [auditorName, setAuditorName] = useState("");
  const [auditorLicense, setAuditorLicense] = useState("");
  const [includeSignature, setIncludeSignature] = useState(false);

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

      const { data: entitiesResult } = await supabase
        .from("entities")
        .select("entity_name, entity_type, risk_level")
        .eq("case_id", caseId);

      setAssets(
        (entitiesResult ?? []).map((e: any) => ({
          entity_name: e.entity_name,
          entity_type: e.entity_type,
          risk_level: e.risk_level,
          estimated_value: 0,
        }))
      );

      const { data: ledgerResult } = await supabase
        .from("event_ledger")
        .select("event_type, event_hash, previous_hash, actor, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      const { data: auditResult } = await supabase
        .from("audit_logs")
        .select("module, action, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      const { data: alertsResult } = await supabase
        .from("alerts")
        .select("alert_type, severity, title, created_at")
        .eq("case_id", caseId);

      const { data: riskResult } = await supabase
        .from("risk_scores")
        .select("total_score, generated_by, created_at")
        .eq("case_id", caseId);

      setLedgerEntries(ledgerResult ?? []);
      setAuditEntries([
        ...(auditResult ?? []),
        ...(alertsResult ?? []).map((a: any) => ({
          module: "alerts",
          action: `${a.alert_type ?? "ALERT"} (${a.severity}): ${a.title}`,
          created_at: a.created_at,
        })),
        ...(riskResult ?? []).map((r: any) => ({
          module: "risk_scores",
          action: `Score total: ${r.total_score} (${r.generated_by})`,
          created_at: r.created_at,
        })),
      ]);
      setLoading(false);
    }

    if (caseId) loadData();
  }, [caseId]);

  function updateAssetValue(index: number, value: string) {
    const updated = [...assets];
    updated[index].estimated_value = parseFloat(value) || 0;
    setAssets(updated);
  }

  function handleDownload() {
    if (!caseData) return;
    const auditorInfo = includeSignature
      ? {
          name: auditorName || "Nombre no especificado",
          license: auditorLicense || "N/D",
          federationName: "Federacion de Colegios de Contadores Publicos de Venezuela",
        }
      : undefined;

    const doc = generateForensicReport(
      caseData,
      ledgerEntries,
      auditEntries,
      engagementType,
      assets,
      auditorInfo
    );
    doc.save("reporte-" + engagementType.toLowerCase() + "-" + caseData.case_code + ".pdf");
  }

  if (loading) {
    return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando caso...</div>;
  }

  if (error || !caseData) {
    return <div style={{ padding: 40, color: "#f87171" }}>{error}</div>;
  }

  const inputStyle = {
    background: "#0d1117",
    border: "1px solid #1a3050",
    borderRadius: 8,
    padding: "8px 12px",
    color: "white",
    width: "100%",
  };

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>
        Reporte Profesional - {caseData.case_code}
      </h1>

      <div style={{ marginTop: 20, lineHeight: 1.8 }}>
        <p><strong>Titulo:</strong> {caseData.title ?? "N/D"}</p>
        <p><strong>Nivel de riesgo:</strong> {caseData.risk_level ?? "N/D"}</p>
        <p><strong>Eventos en cadena de custodia:</strong> {ledgerEntries.length}</p>
      </div>

      <div style={{ marginTop: 30 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#7dd3fc" }}>
          TIPO DE ENCARGO PROFESIONAL
        </label>
        <select
          value={engagementType}
          onChange={(e) => setEngagementType(e.target.value as EngagementType)}
          style={{ ...inputStyle, marginTop: 8 }}
        >
          <option value="COMPILATION">Compilacion (NICC/ISRS 4410)</option>
          <option value="REVIEW">Revision - Atestiguamiento limitado (NIA/ISRE 2400)</option>
          <option value="AUDIT">Auditoria - Aseguramiento razonable (NIA/ISA)</option>
        </select>
      </div>

      {assets.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#7dd3fc" }}>
            Estado de Situacion Financiera de Activos Digitales
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
            Ajusta el valor estimado de cada activo antes de generar el informe.
          </p>
          <div style={{ marginTop: 12 }}>
            {assets.map((asset, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <span>{asset.entity_name} ({asset.entity_type})</span>
                <input
                  type="number"
                  placeholder="Valor estimado USD"
                  value={asset.estimated_value || ""}
                  onChange={(e) => updateAssetValue(idx, e.target.value)}
                  style={inputStyle}
                />
                <span>{asset.risk_level ?? "N/D"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#7dd3fc" }}>
          <input
            type="checkbox"
            checked={includeSignature}
            onChange={(e) => setIncludeSignature(e.target.checked)}
          />
          INCLUIR FIRMA DEL PROFESIONAL RESPONSABLE
        </label>

        {includeSignature && (
          <div style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 400 }}>
            <input
              placeholder="Nombre completo"
              value={auditorName}
              onChange={(e) => setAuditorName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Numero de matricula"
              value={auditorLicense}
              onChange={(e) => setAuditorLicense(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}
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
        DESCARGAR INFORME PDF
      </button>
    </div>
  );
}
