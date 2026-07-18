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
  const [factor, setFactor] = useState("795.73");
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
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadHistory(cid);
    }
    load();
  }, []);

  function calculateQualification() {
    const patrimonio = parseFloat(patrimonioBs) || 0;
    const tasa = parseFloat(tasaBcv) || 1;
    const f = parseFloat(factor) || 795.73;
    return (patrimonio / tasa) * (f / 795.73);
  }

  async function saveQualification() {
    setMessage("");
    if (!companyId || !patrimonioBs || !tasaBcv) { setMessage("Completa Patrimonio y Tasa BCV."); return; }

    const qualification = calculateQualification();

    const { error } = await supabase.from("apu_financial_qualification").insert([{
      company_id: companyId,
      patrimonio_bs: parseFloat(patrimonioBs),
      tasa_bcv: parseFloat(tasaBcv),
      factor: parseFloat(factor) || 795.73,
      qualification_usd: qualification,
      notes,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Calificacion Financiera calculada: $" + qualification.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    if (companyId) await loadHistory(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };
  const qualification = calculateQualification();

  return (
    <VerticalPageLayout vertical="apu" title="Calificacion Financiera" subtitle="Capacidad de contratacion ante el Estado - Formula oficial SNC" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Patrimonio de la Empresa (Bs)</label>
        <input type="number" value={patrimonioBs} onChange={(e) => setPatrimonioBs(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="Ej. 50000000" />

        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Tasa BCV (Bs/USD)</label>
        <input type="number" value={tasaBcv} onChange={(e) => setTasaBcv(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="Ej. 36.50" />

        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Factor de Calificacion (SNC)</label>
        <input type="number" value={factor} onChange={(e) => setFactor(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, marginTop: 14 }} placeholder="Notas (opcional)" />

        <div style={{ ...theme.cardStyle, marginTop: 20 }}>
          <p style={{ fontSize: 18, color: "#8B93A7" }}>Calificacion Financiera Estimada</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", marginTop: 8, fontFamily: "monospace" }}>
            ${qualification.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        <button onClick={saveQualification} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          GUARDAR CALIFICACION
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Historial de Calificaciones</h2>
          {history.map((h) => (
            <div key={h.id} style={{ ...theme.cardStyle, marginTop: 12 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#4ade80" }}>${h.qualification_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p style={{ fontSize: 16, color: "#8B93A7", marginTop: 4 }}>
                Patrimonio: {h.patrimonio_bs.toLocaleString()} Bs | Tasa: {h.tasa_bcv} | {new Date(h.calculated_at).toLocaleDateString()}
              </p>
              {h.notes && <p style={{ fontSize: 16, marginTop: 6 }}>{h.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
