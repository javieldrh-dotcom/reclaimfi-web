"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "ANNUAL"];
const FREQ_LABELS: Record<string, string> = { ONE_TIME: "Unica vez", MONTHLY: "Mensual", QUARTERLY: "Trimestral", ANNUAL: "Anual" };

export default function CompliancePage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filings, setFilings] = useState<Record<string, any[]>>({});

  const [reqName, setReqName] = useState("");
  const [regulatoryBody, setRegulatoryBody] = useState("");
  const [frequency, setFrequency] = useState("ANNUAL");
  const [nextDueDate, setNextDueDate] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");

  const [filingDate, setFilingDate] = useState(new Date().toISOString().slice(0, 10));
  const [filingNotes, setFilingNotes] = useState("");
  const [message, setMessage] = useState("");

  async function loadRequirements(cid: string) {
    const { data } = await supabase.from("compliance_requirements").select("*").eq("company_id", cid).order("next_due_date", { ascending: true });
    setRequirements(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadRequirements(cid);
    }
    load();
  }, []);

  async function addRequirement() {
    if (!companyId || !reqName.trim()) { setMessage("Ingresa el nombre del requisito."); return; }
    const { error } = await supabase.from("compliance_requirements").insert([{
      company_id: companyId,
      requirement_name: reqName.trim(),
      regulatory_body: regulatoryBody.trim() || null,
      frequency,
      next_due_date: nextDueDate || null,
      responsible_person: responsiblePerson.trim() || null,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setReqName(""); setRegulatoryBody(""); setNextDueDate(""); setResponsiblePerson("");
    setMessage("Requisito registrado.");
    await loadRequirements(companyId);
  }

  async function loadFilings(reqId: string) {
    const { data } = await supabase.from("compliance_filings").select("*").eq("requirement_id", reqId).order("filed_date", { ascending: false });
    setFilings((prev) => ({ ...prev, [reqId]: data ?? [] }));
  }

  async function toggleExpand(reqId: string) {
    if (expandedId === reqId) { setExpandedId(null); return; }
    setExpandedId(reqId);
    if (!filings[reqId]) await loadFilings(reqId);
  }

  async function addFiling(req: any) {
    if (!companyId) return;
    const { error } = await supabase.from("compliance_filings").insert([{
      requirement_id: req.id,
      company_id: companyId,
      filed_date: filingDate,
      notes: filingNotes.trim() || null,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }

    let nextDate = req.next_due_date;
    if (req.frequency === "MONTHLY") nextDate = addMonths(filingDate, 1);
    else if (req.frequency === "QUARTERLY") nextDate = addMonths(filingDate, 3);
    else if (req.frequency === "ANNUAL") nextDate = addMonths(filingDate, 12);

    await supabase.from("compliance_requirements").update({ next_due_date: nextDate, status: "UP_TO_DATE" }).eq("id", req.id);

    setFilingNotes("");
    setMessage("Presentacion registrada.");
    await loadFilings(req.id);
    await loadRequirements(companyId);
  }

  function addMonths(dateStr: string, months: number) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }

  function daysUntil(dateStr: string | null) {
    if (!dateStr) return null;
    const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return Math.round(diff);
  }

  const inputStyle = { width: "100%", padding: 12, background: "#0d1117", border: "1px solid #1F2937", borderRadius: 8, color: "white", marginTop: 8 };

  if (loading) return <div style={{ padding: 40, color: "white", background: "#0B0E14", minHeight: "100vh" }}>Cargando...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E14", color: "white", padding: 40 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900 }}>Cumplimiento Regulatorio</h1>
        <p style={{ color: "#8B93A7", marginTop: 8 }}>Licencias, registros corporativos, permisos, y certificaciones profesionales (no fiscal - eso esta en Contabilidad).</p>

        <div style={{ background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #1F2937", marginTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>Registrar Requisito de Cumplimiento</h3>
          <input value={reqName} onChange={(e) => setReqName(e.target.value)} style={inputStyle} placeholder="Nombre del requisito (ej. Licencia de Actividades Economicas)" />
          <input value={regulatoryBody} onChange={(e) => setRegulatoryBody(e.target.value)} style={inputStyle} placeholder="Ente regulador (ej. Alcaldia, Colegio de Contadores)" />
          <div style={{ display: "flex", gap: 10 }}>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
            <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <input value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} style={inputStyle} placeholder="Persona responsable" />
          <button onClick={addRequirement} style={{ marginTop: 12, padding: "10px 24px", background: "#a78bfa", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Registrar Requisito
          </button>
          {message && <p style={{ marginTop: 8, color: message.includes("Error") ? "#f87171" : "#a78bfa" }}>{message}</p>}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Requisitos Registrados ({requirements.length})</h2>
        {requirements.length === 0 ? (
          <p style={{ color: "#8B93A7" }}>Aun no hay requisitos registrados.</p>
        ) : (
          requirements.map((req) => {
            const days = daysUntil(req.next_due_date);
            const isOverdue = days !== null && days < 0;
            const isUpcoming = days !== null && days >= 0 && days <= 30;
            return (
              <div key={req.id} style={{ background: "#151A24", borderRadius: 12, padding: 16, marginBottom: 8, border: "1px solid " + (isOverdue ? "#f87171" : isUpcoming ? "#facc15" : "#1F2937") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleExpand(req.id)}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{req.requirement_name}</p>
                    <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>
                      {req.regulatory_body && req.regulatory_body + " · "}
                      {FREQ_LABELS[req.frequency]}
                      {req.responsible_person && " · " + req.responsible_person}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {req.next_due_date && (
                      <p style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? "#f87171" : isUpcoming ? "#facc15" : "#4ade80" }}>
                        {isOverdue ? "VENCIDO" : "Vence: " + req.next_due_date}
                      </p>
                    )}
                  </div>
                </div>

                {expandedId === req.id && (
                  <div style={{ marginTop: 16, borderTop: "1px solid #1F2937", paddingTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 8 }}>Historial de Presentaciones</p>
                    {(filings[req.id] ?? []).length === 0 ? (
                      <p style={{ fontSize: 13, color: "#8B93A7" }}>Sin presentaciones registradas.</p>
                    ) : (
                      (filings[req.id] ?? []).map((f) => (
                        <div key={f.id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #1F2937" }}>
                          {f.filed_date}{f.notes && " - " + f.notes}
                        </div>
                      ))
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input type="date" value={filingDate} onChange={(e) => setFilingDate(e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                      <input value={filingNotes} onChange={(e) => setFilingNotes(e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 2 }} placeholder="Notas (opcional)" />
                      <button onClick={() => addFiling(req)} style={{ padding: "0 16px", background: "#a78bfa", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                        Registrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}