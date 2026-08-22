"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function AmlPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"POLICY" | "TRAINING" | "SAR">("POLICY");
  const [loading, setLoading] = useState(true);

  const [policies, setPolicies] = useState<any[]>([]);
  const [policyName, setPolicyName] = useState("");
  const [policyDescription, setPolicyDescription] = useState("");
  const [lastReviewed, setLastReviewed] = useState("");
  const [nextReview, setNextReview] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");

  const [trainings, setTrainings] = useState<any[]>([]);
  const [employeeName, setEmployeeName] = useState("");
  const [trainingTopic, setTrainingTopic] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [certified, setCertified] = useState(false);

  const [sarReports, setSarReports] = useState<any[]>([]);
  const [entityInvolved, setEntityInvolved] = useState("");
  const [sarDescription, setSarDescription] = useState("");
  const [detectionDate, setDetectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportedToAuthority, setReportedToAuthority] = useState(false);
  const [reportDate, setReportDate] = useState("");

  const [message, setMessage] = useState("");

  async function loadAll(cid: string) {
    const { data: p } = await supabase.from("aml_policies").select("*").eq("company_id", cid).order("created_at", { ascending: false });
    const { data: t } = await supabase.from("aml_training_records").select("*").eq("company_id", cid).order("training_date", { ascending: false });
    const { data: s } = await supabase.from("sar_reports").select("*").eq("company_id", cid).order("detection_date", { ascending: false });
    setPolicies(p ?? []);
    setTrainings(t ?? []);
    setSarReports(s ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadAll(cid);
    }
    load();
  }, []);

  async function addPolicy() {
    if (!companyId || !policyName.trim()) { setMessage("Ingresa el nombre de la politica."); return; }
    const { error } = await supabase.from("aml_policies").insert([{
      company_id: companyId,
      policy_name: policyName.trim(),
      description: policyDescription.trim() || null,
      last_reviewed_date: lastReviewed || null,
      next_review_date: nextReview || null,
      responsible_person: responsiblePerson.trim() || null,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setPolicyName(""); setPolicyDescription(""); setLastReviewed(""); setNextReview(""); setResponsiblePerson("");
    setMessage("Politica registrada.");
    await loadAll(companyId);
  }

  async function addTraining() {
    if (!companyId || !employeeName.trim() || !trainingTopic.trim()) { setMessage("Completa empleado y tema de capacitacion."); return; }
    const { error } = await supabase.from("aml_training_records").insert([{
      company_id: companyId,
      employee_name: employeeName.trim(),
      training_topic: trainingTopic.trim(),
      training_date: trainingDate,
      certified,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setEmployeeName(""); setTrainingTopic(""); setCertified(false);
    setMessage("Registro de capacitacion agregado.");
    await loadAll(companyId);
  }

  async function addSarReport() {
    if (!companyId || !entityInvolved.trim() || !sarDescription.trim()) { setMessage("Completa entidad involucrada y descripcion."); return; }
    const { error } = await supabase.from("sar_reports").insert([{
      company_id: companyId,
      entity_involved: entityInvolved.trim(),
      description: sarDescription.trim(),
      detection_date: detectionDate,
      reported_to_authority: reportedToAuthority,
      report_date: reportedToAuthority ? (reportDate || null) : null,
      status: reportedToAuthority ? "REPORTED" : "UNDER_REVIEW",
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setEntityInvolved(""); setSarDescription(""); setReportedToAuthority(false); setReportDate("");
    setMessage("Reporte de actividad sospechosa registrado.");
    await loadAll(companyId);
  }

  const inputStyle = { width: "100%", padding: 12, background: "#0d1117", border: "1px solid #1F2937", borderRadius: 8, color: "white", marginTop: 8 };
  const tabStyle = (active: boolean) => ({ padding: "10px 20px", borderRadius: 8, border: "1px solid " + (active ? "#facc15" : "#1F2937"), background: active ? "#facc1518" : "transparent", color: active ? "#facc15" : "#8B93A7", cursor: "pointer", fontWeight: 700, fontSize: 13 });

  if (loading) return <div style={{ padding: 40, color: "white", background: "#0B0E14", minHeight: "100vh" }}>Cargando...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E14", color: "white", padding: 40 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900 }}>Cumplimiento AML</h1>
        <p style={{ color: "#8B93A7", marginTop: 8 }}>Politicas, capacitacion, y reportes de actividad sospechosa para prevencion de lavado de dinero.</p>

        <div style={{ display: "flex", gap: 10, marginTop: 24, marginBottom: 20 }}>
          <button onClick={() => setTab("POLICY")} style={tabStyle(tab === "POLICY")}>Politica ({policies.length})</button>
          <button onClick={() => setTab("TRAINING")} style={tabStyle(tab === "TRAINING")}>Capacitacion ({trainings.length})</button>
          <button onClick={() => setTab("SAR")} style={tabStyle(tab === "SAR")}>Reportes ROS ({sarReports.length})</button>
        </div>

        {message && <p style={{ marginBottom: 16, color: message.includes("Error") ? "#f87171" : "#facc15" }}>{message}</p>}

        {tab === "POLICY" && (
          <div>
            <div style={{ background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #1F2937", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#facc15" }}>Registrar Politica AML</h3>
              <input value={policyName} onChange={(e) => setPolicyName(e.target.value)} style={inputStyle} placeholder="Nombre de la politica (ej. Manual de Prevencion de Lavado de Dinero)" />
              <textarea value={policyDescription} onChange={(e) => setPolicyDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} placeholder="Descripcion breve del contenido" />
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#8B93A7" }}>Ultima revision</label>
                  <input type="date" value={lastReviewed} onChange={(e) => setLastReviewed(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#8B93A7" }}>Proxima revision</label>
                  <input type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <input value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} style={inputStyle} placeholder="Persona responsable" />
              <button onClick={addPolicy} style={{ marginTop: 12, padding: "10px 24px", background: "#facc15", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Registrar Politica
              </button>
            </div>
            {policies.map((p) => (
              <div key={p.id} style={{ background: "#151A24", borderRadius: 12, padding: 16, marginBottom: 8, border: "1px solid #1F2937" }}>
                <p style={{ fontWeight: 700 }}>{p.policy_name}</p>
                {p.description && <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>{p.description}</p>}
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 6 }}>
                  {p.responsible_person && "Responsable: " + p.responsible_person + " · "}
                  {p.next_review_date && "Proxima revision: " + p.next_review_date}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "TRAINING" && (
          <div>
            <div style={{ background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #1F2937", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#facc15" }}>Registrar Capacitacion</h3>
              <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={inputStyle} placeholder="Nombre del empleado" />
              <input value={trainingTopic} onChange={(e) => setTrainingTopic(e.target.value)} style={inputStyle} placeholder="Tema de la capacitacion" />
              <input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} style={inputStyle} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13 }}>
                <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
                Certificado / completado
              </label>
              <button onClick={addTraining} style={{ marginTop: 12, padding: "10px 24px", background: "#facc15", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Registrar Capacitacion
              </button>
            </div>
            {trainings.map((t) => (
              <div key={t.id} style={{ background: "#151A24", borderRadius: 12, padding: 16, marginBottom: 8, border: "1px solid #1F2937", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{t.employee_name}</p>
                  <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>{t.training_topic} · {t.training_date}</p>
                </div>
                <span style={{ color: t.certified ? "#4ade80" : "#facc15", fontSize: 12, fontWeight: 700 }}>{t.certified ? "CERTIFICADO" : "PENDIENTE"}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "SAR" && (
          <div>
            <div style={{ background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #1F2937", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#facc15" }}>Registrar Reporte de Actividad Sospechosa</h3>
              <input value={entityInvolved} onChange={(e) => setEntityInvolved(e.target.value)} style={inputStyle} placeholder="Entidad o persona involucrada" />
              <textarea value={sarDescription} onChange={(e) => setSarDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} placeholder="Descripcion de la actividad sospechosa" />
              <input type="date" value={detectionDate} onChange={(e) => setDetectionDate(e.target.value)} style={inputStyle} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13 }}>
                <input type="checkbox" checked={reportedToAuthority} onChange={(e) => setReportedToAuthority(e.target.checked)} />
                Ya fue reportado a la autoridad competente
              </label>
              {reportedToAuthority && (
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={inputStyle} placeholder="Fecha del reporte" />
              )}
              <button onClick={addSarReport} style={{ marginTop: 12, padding: "10px 24px", background: "#facc15", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Registrar Reporte
              </button>
            </div>
            {sarReports.map((s) => (
              <div key={s.id} style={{ background: "#151A24", borderRadius: 12, padding: 16, marginBottom: 8, border: "1px solid #1F2937" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontWeight: 700 }}>{s.entity_involved}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.status === "REPORTED" ? "#4ade80" : "#facc15" }}>{s.status === "REPORTED" ? "REPORTADO" : "EN REVISION"}</span>
                </div>
                <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>{s.description}</p>
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 6 }}>Deteccion: {s.detection_date}{s.report_date && " · Reportado: " + s.report_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}