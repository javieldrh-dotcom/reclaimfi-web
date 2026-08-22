"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function ArbitrageDetectionPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [shareSignals, setShareSignals] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: comp } = await supabase.from("companies").select("share_arbitrage_signals").eq("id", cid).single();
        setShareSignals(comp?.share_arbitrage_signals ?? false);
      }
    }
    load();
  }, []);

  async function toggleShareSignals() {
    if (!companyId) return;
    const newValue = !shareSignals;
    setShareSignals(newValue);
    await supabase.from("companies").update({ share_arbitrage_signals: newValue }).eq("id", companyId);
  }

  async function runAnalysis() {
    if (!companyId) return;
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await fetch("/api/detect-arbitrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json);
      } else {
        setMessage(json.error || "No se pudo completar el analisis.");
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <VerticalPageLayout vertical="accounting" title="Detector de Arbitraje Cambiario" subtitle="Identifica transacciones registradas cerca de cambios significativos en la tasa de cambio" fullWidth>
      <div style={{ ...theme.cardStyle, maxWidth: 700, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 16 }}>
          Cruza tus asientos contables reales contra el historial de tasas de cambio registrado, buscando transacciones concentradas cerca de cambios significativos de tasa (mas de 5% de variacion) que podrian sugerir cronometraje deliberado para aprovechar el diferencial cambiario. Esto es una senal para investigar, no una acusacion.
        </p>
        <button onClick={runAnalysis} disabled={loading || !companyId} style={{ ...theme.buttonStyle, opacity: loading || !companyId ? 0.6 : 1 }}>
          {loading ? "Analizando..." : "Ejecutar Analisis"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 13, color: "#f87171" }}>{message}</p>}
      </div>

      <div style={{ ...theme.cardStyle, maxWidth: 700, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>Compartir señales anonimas con socios externos</p>
          <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>Si activas esto, tus señales de riesgo MEDIO/ALTO (sin el nombre de tu empresa) estaran disponibles para plataformas asociadas que consulten el feed externo.</p>
        </div>
        <button onClick={toggleShareSignals} style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid " + (shareSignals ? "#4ade80" : "#2A3040"), background: shareSignals ? "#4ade8020" : "transparent", color: shareSignals ? "#4ade80" : "#8B93A7", cursor: "pointer", fontSize: 13, fontWeight: 700, minWidth: 90 }}>
          {shareSignals ? "ACTIVADO" : "DESACTIVADO"}
        </button>
      </div>

      {result && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ ...theme.cardStyle, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#8B93A7" }}>
              {result.significantRateChanges} cambio(s) significativo(s) de tasa detectados en tu historial · {result.flaggedCount} transaccion(es) registradas cerca de esos cambios
            </p>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: result.result.riskLevel === "HIGH" ? "#f8717120" : result.result.riskLevel === "MEDIUM" ? "#facc1520" : "#4ade8020",
              border: "1px solid " + (result.result.riskLevel === "HIGH" ? "#f87171" : result.result.riskLevel === "MEDIUM" ? "#facc15" : "#4ade80"),
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 18, color: result.result.riskLevel === "HIGH" ? "#f87171" : result.result.riskLevel === "MEDIUM" ? "#facc15" : "#4ade80" }}>
              Riesgo: {result.result.riskLevel}
            </p>
            {result.result.findings.length > 0 && (
              <ul style={{ marginTop: 12, fontSize: 14 }}>
                {result.result.findings.map((f: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{f}</li>)}
              </ul>
            )}
            <p style={{ marginTop: 12, fontSize: 14, color: "#8B93A7" }}>{result.result.recommendation}</p>
          </div>
        </div>
      )}
    </VerticalPageLayout>
  );
}
