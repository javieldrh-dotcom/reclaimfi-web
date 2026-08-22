"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function FinancialQualificationPage() {
  const theme = getVerticalTheme("apu");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [patrimonioBs, setPatrimonioBs] = useState("");
  const [tasaBcv, setTasaBcv] = useState("");
  const [factor, setFactor] = useState("1");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  async function loadHistory(cid: string) {
    const { data } = await supabase.from("apu_financial_qualification").select("*").eq("company_id", cid).order("calculated_at", { ascending: false });
    setHistory(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadHistory(cid);
    }
    load();
  }, []);

  function calculatePatrimonioUsd() {
    const patrimonio = parseFloat(patrimonioBs) || 0;
    const tasa = parseFloat(tasaBcv) || 1;
    const f = parseFloat(factor) || 1;
    return (patrimonio / tasa) * f;
  }

  async function saveQualification() {
    setMessage("");
    if (!companyId || !patrimonioBs || !tasaBcv) { setMessage("Completa Patrimonio y Tasa BCV."); return; }

    const qualification = calculatePatrimonioUsd();

    const { error } = await supabase.from("apu_financial_qualification").insert([{
      company_id: companyId,
      patrimonio_bs: parseFloat(patrimonioBs),
      tasa_bcv: parseFloat(tasaBcv),
      factor: parseFloat(factor) || 1,
      qualification_usd: qualification,
      notes,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Guardado: $" + qualification.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    if (companyId) await loadHistory(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };
  const patrimonioUsd = calculatePatrimonioUsd();

  return (
    <VerticalPageLayout vertical="apu" title="Capacidad Financiera de Referencia" subtitle="Calculadora de apoyo, no sustituye la matriz oficial de cada ente contratante" fullWidth>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ ...theme.cardStyle, marginBottom: 20, border: "1px solid #FACC1560", background: "#FACC1510" }}>
          <p style={{ fontSize: 14, color: "#FACC15", fontWeight: 700, marginBottom: 6 }}>Aviso importante</p>
          <p style={{ fontSize: 13, color: "#B0B8C8", lineHeight: 1.6 }}>
            No existe una formula unica u oficial del SNC para calificacion financiera. Cada ente contratante (PDVSA, alcaldias, empresas del Estado, etc.) define su propia matriz de calificacion con sus propios criterios y puntuacion minima, establecida en el pliego especifico de cada proceso. Esta herramienta solo convierte tu patrimonio en Bs a su equivalente en USD como referencia base - siempre verifica los criterios exactos del pliego de la licitacion a la que te presentas.
          </p>
        </div>

        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Patrimonio de la Empresa (Bs)</label>
        <input type="number" value={patrimonioBs} onChange={(e) => setPatrimonioBs(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="Ej. 50000000" />

        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Tasa BCV (Bs/USD)</label>
        <input type="number" value={tasaBcv} onChange={(e) => setTasaBcv(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="Ej. 36.50" />

        <label style={{ fontSize: 14, color: "#8B93A7", marginTop: 14, display: "block" }}>Multiplicador segun matriz del ente contratante (opcional, revisa el pliego especifico - deja en 1 si no aplica ninguno)</label>
        <input type="number" value={factor} onChange={(e) => setFactor(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, marginTop: 14 }} placeholder="Notas (ej. a que licitacion corresponde este calculo)" />

        <div style={{ ...theme.cardStyle, marginTop: 20 }}>
          <p style={{ fontSize: 16, color: "#8B93A7" }}>Patrimonio en USD (referencia)</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", marginTop: 8, fontFamily: "monospace" }}>
            ${patrimonioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        <button onClick={saveQualification} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          GUARDAR CALCULO
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Historial</h2>
          {history.map((h) => (
            <div key={h.id} style={{ ...theme.cardStyle, marginTop: 12 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#4ade80" }}>${h.qualification_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p style={{ fontSize: 16, color: "#8B93A7", marginTop: 4 }}>
                Patrimonio: {h.patrimonio_bs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs | Tasa: {h.tasa_bcv} | {new Date(h.calculated_at).toLocaleDateString()}
              </p>
              {h.notes && <p style={{ fontSize: 16, marginTop: 6 }}>{h.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}