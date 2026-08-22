"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function BlockchainReconciliationPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordDescription, setRecordDescription] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      setCompanyId(uc?.company_id ?? null);
    }
    load();
  }, []);

  async function runReconciliation() {
    if (!companyId || !recordDate || !recordAmount || !walletAddress.trim()) {
      setMessage("Completa la fecha, el monto, y la direccion de wallet.");
      return;
    }
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await fetch("/api/reconcile-blockchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          recordDate,
          recordDescription,
          recordAmountUsd: parseFloat(recordAmount),
          walletAddress: walletAddress.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json);
      } else {
        setMessage(json.error || "No se pudo completar la conciliacion.");
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setLoading(false);
  }

  const statusColors: Record<string, string> = { MATCH: "#4ade80", DISCREPANCY: "#facc15", NO_EVIDENCE: "#f87171" };
  const statusLabels: Record<string, string> = { MATCH: "COINCIDE", DISCREPANCY: "DISCREPANCIA", NO_EVIDENCE: "SIN EVIDENCIA" };

  return (
    <VerticalPageLayout vertical="accounting" title="Conciliacion Contabilidad vs. Blockchain" subtitle="Verifica si un registro contable de una operacion cripto coincide con lo que realmente muestra la blockchain publica" fullWidth>
      <div style={{ ...theme.cardStyle, maxWidth: 700, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 16 }}>
          Ingresa los datos del registro contable de una operacion en Bitcoin (soportado por ahora solo Bitcoin), y la wallet involucrada. Se consultara la blockchain real para verificar si existe una transaccion que respalde lo registrado.
        </p>
        <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} style={theme.inputStyle} />
        <input value={recordDescription} onChange={(e) => setRecordDescription(e.target.value)} style={{ ...theme.inputStyle, marginTop: 10 }} placeholder="Descripcion del registro contable" />
        <input type="number" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} style={{ ...theme.inputStyle, marginTop: 10 }} placeholder="Monto registrado (USD)" />
        <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} style={{ ...theme.inputStyle, marginTop: 10 }} placeholder="Direccion de Bitcoin involucrada" />
        <button onClick={runReconciliation} disabled={loading || !companyId} style={{ ...theme.buttonStyle, marginTop: 12, opacity: loading || !companyId ? 0.6 : 1 }}>
          {loading ? "Conciliando..." : "Conciliar contra Blockchain"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 13, color: "#f87171" }}>{message}</p>}
      </div>

      {result && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: statusColors[result.result.matchStatus] + "20",
              border: "1px solid " + statusColors[result.result.matchStatus],
              marginBottom: 16,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 20, color: statusColors[result.result.matchStatus] }}>
              {statusLabels[result.result.matchStatus]}
            </p>
            {result.result.findings.length > 0 && (
              <ul style={{ marginTop: 12, fontSize: 14 }}>
                {result.result.findings.map((f: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{f}</li>)}
              </ul>
            )}
            <p style={{ marginTop: 12, fontSize: 14, color: "#8B93A7" }}>{result.result.recommendation}</p>
          </div>

          {result.nearbyTransactions.length > 0 && (
            <div style={{ ...theme.cardStyle }}>
              <h3 style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Transacciones Reales Encontradas en la Blockchain (±7 dias)</h3>
              {result.nearbyTransactions.map((t: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #2A3040", fontSize: 13 }}>
                  <span>{t.date}</span>
                  <span style={{ color: t.direction === "IN" ? "#4ade80" : "#f87171" }}>
                    {t.direction === "IN" ? "Recibio" : "Envio"} {t.valueBtc.toFixed(6)} BTC (~${(t.valueBtc * result.btcUsdRate).toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </VerticalPageLayout>
  );
}