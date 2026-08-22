"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function DueDiligencePage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState<"PROVEEDOR" | "CLIENTE">("PROVEEDOR");
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

  async function runCheck() {
    if (!companyId || !entityName.trim()) { setMessage("Ingresa el nombre a investigar."); return; }
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await fetch("/api/due-diligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, entityName: entityName.trim(), entityType }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json);
      } else {
        setMessage(json.error || "No se pudo completar la verificacion.");
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <VerticalPageLayout vertical="accounting" title="Debida Diligencia" subtitle="Verificacion de proveedores y clientes: menciones adversas en fuentes publicas + historial real de tu empresa" fullWidth>
      <div style={{ ...theme.cardStyle, maxWidth: 700, marginBottom: 24 }}>
        <input value={entityName} onChange={(e) => setEntityName(e.target.value)} style={theme.inputStyle} placeholder="Nombre del proveedor o cliente a investigar" />
        <select value={entityType} onChange={(e) => setEntityType(e.target.value as any)} style={{ ...theme.inputStyle, marginTop: 10 }}>
          <option value="PROVEEDOR">Proveedor</option>
          <option value="CLIENTE">Cliente</option>
        </select>
        <button onClick={runCheck} disabled={loading || !companyId} style={{ ...theme.buttonStyle, marginTop: 12, opacity: loading || !companyId ? 0.6 : 1 }}>
          {loading ? "Investigando..." : "Realizar Debida Diligencia"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 13, color: "#f87171" }}>{message}</p>}
      </div>

      {result && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ ...theme.cardStyle, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>Historial de Relacion Comercial (datos propios)</h3>
            <p style={{ fontSize: 14 }}>Transacciones registradas: {result.history.transactionCount}</p>
            <p style={{ fontSize: 14 }}>Monto total historico: ${result.history.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            {result.history.firstDate && <p style={{ fontSize: 14 }}>Desde: {result.history.firstDate} hasta {result.history.lastDate}</p>}
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
            <p style={{ marginTop: 10, fontSize: 14 }}>{result.result.relationshipAssessment}</p>
            {result.result.adverseMediaFindings.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>Menciones adversas encontradas:</p>
                <ul style={{ marginTop: 6, fontSize: 14 }}>
                  {result.result.adverseMediaFindings.map((f: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{f}</li>)}
                </ul>
              </div>
            )}
            <p style={{ marginTop: 12, fontSize: 14, color: "#8B93A7" }}>{result.result.recommendation}</p>
            {result.result.sourcesChecked.length > 0 && (
              <p style={{ marginTop: 10, fontSize: 12, color: "#8B93A7" }}>Fuentes consultadas: {result.result.sourcesChecked.join(", ")}</p>
            )}
          </div>
        </div>
      )}
    </VerticalPageLayout>
  );
}