"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

// Fase 7: planificacion de auditoria para un caso financiero -- materialidad
// y evaluacion de riesgo por asercion (ver migracion
// 2026-10-13-fase7-materialidad-riesgo.sql para el porque). Se llega aqui
// desde el boton "Planificacion" del Audit Control Center financiero
// (/dashboard/audit/financiero), con el caso en la URL (?case=ID), mismo
// patron que ya usa ese modulo para preseleccionar un caso desde otra
// pagina.
const BENCHMARK_LABELS: Record<string, string> = {
  INGRESOS: "Ingresos",
  ACTIVOS_TOTALES: "Activos Totales",
  UTILIDAD_NETA: "Utilidad Neta",
  PATRIMONIO: "Patrimonio",
};

const ASSERTIONS = [
  { code: "EXISTENCIA", label: "Existencia" },
  { code: "INTEGRIDAD", label: "Integridad (Completitud)" },
  { code: "VALUACION", label: "Valuacion" },
  { code: "DERECHOS_OBLIGACIONES", label: "Derechos y Obligaciones" },
  { code: "PRESENTACION_REVELACION", label: "Presentacion y Revelacion" },
];

const RISK_LEVELS = ["BAJO", "MEDIO", "ALTO"];
const RISK_COLOR: Record<string, string> = { BAJO: "#4ade80", MEDIO: "#facc15", ALTO: "#f87171" };

// Combina riesgo inherente + riesgo de control en un riesgo combinado por
// defecto (el auditor puede sobreescribirlo si su juicio profesional
// difiere -- esto es solo un punto de partida razonable, no una regla
// rigida): el mayor de los dos domina, salvo que ambos sean BAJO.
function suggestCombinedRisk(inherent: string, control: string): string {
  if (inherent === "ALTO" || control === "ALTO") return "ALTO";
  if (inherent === "MEDIO" || control === "MEDIO") return "MEDIO";
  return "BAJO";
}

export default function AuditPlanningPage() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Materialidad
  const [benchmarkType, setBenchmarkType] = useState("INGRESOS");
  const [benchmarkAmount, setBenchmarkAmount] = useState("");
  const [materialityPct, setMaterialityPct] = useState("5");
  const [performancePct, setPerformancePct] = useState("75");
  const [trivialPct, setTrivialPct] = useState("5");
  const [notes, setNotes] = useState("");
  const [materialityMessage, setMaterialityMessage] = useState("");
  const [existingMateriality, setExistingMateriality] = useState<any>(null);

  // Riesgo por asercion
  const [areas, setAreas] = useState<string[]>(["Efectivo y Equivalentes", "Cuentas por Cobrar", "Inventario", "Cuentas por Pagar", "Ingresos"]);
  const [newArea, setNewArea] = useState("");
  const [riskRows, setRiskRows] = useState<Record<string, any>>({}); // key: area|assertion
  const [riskMessage, setRiskMessage] = useState("");
  const [savingRiskKey, setSavingRiskKey] = useState<string | null>(null);

  // Programa de auditoria
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [newProcArea, setNewProcArea] = useState("");
  const [newProcAssertion, setNewProcAssertion] = useState("");
  const [newProcType, setNewProcType] = useState("SUSTANTIVA");
  const [newProcDescription, setNewProcDescription] = useState("");
  const [procMessage, setProcMessage] = useState("");
  const [reviewNotesDraft, setReviewNotesDraft] = useState<Record<string, string>>({});

  // Muestreo (MUS, cero errores esperados -- AICPA Audit Sampling Guide)
  const [samplingPlans, setSamplingPlans] = useState<any[]>([]);
  const [samplingArea, setSamplingArea] = useState("");
  const [populationDescription, setPopulationDescription] = useState("");
  const [populationAmount, setPopulationAmount] = useState("");
  const [tolerableMisstatement, setTolerableMisstatement] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [samplingMessage, setSamplingMessage] = useState("");

  useEffect(() => {
    const cid = new URLSearchParams(window.location.search).get("case");
    setCaseId(cid);
    if (!cid) { setLoading(false); return; }
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData?.user?.id ?? null);

      const { data: c } = await supabase.from("cases").select("id, case_code, title, case_type, sector").eq("id", cid!).single();
      setCaseInfo(c ?? null);

      const { data: mat } = await supabase.from("audit_materiality").select("*").eq("case_id", cid!).maybeSingle();
      if (mat) {
        setExistingMateriality(mat);
        setBenchmarkType(mat.benchmark_type);
        setBenchmarkAmount(String(mat.benchmark_amount));
        setMaterialityPct(String(mat.materiality_percentage));
        setPerformancePct(String(mat.performance_materiality_percentage));
        setTrivialPct(String((mat.trivial_threshold_amount / mat.materiality_amount) * 100 || 5));
        setNotes(mat.notes ?? "");
        // La materialidad de ejecucion ya calculada es el punto de partida
        // razonable para el error tolerable de una muestra -- el auditor
        // puede cambiarlo, pero no debe empezar en blanco.
        setTolerableMisstatement(String(mat.performance_materiality_amount));
      }

      const { data: risks } = await supabase.from("audit_risk_assessments").select("*").eq("case_id", cid!);
      const rowsByKey: Record<string, any> = {};
      const loadedAreas = new Set<string>();
      (risks ?? []).forEach((r: any) => {
        rowsByKey[r.area + "|" + r.assertion] = r;
        loadedAreas.add(r.area);
      });
      setRiskRows(rowsByKey);
      if (loadedAreas.size > 0) {
        setAreas((prev) => Array.from(new Set([...prev, ...loadedAreas])));
      }

      await loadProcedures(cid!);
      const { data: sampling } = await supabase.from("audit_sampling_plans").select("*").eq("case_id", cid!).order("created_at", { ascending: false });
      setSamplingPlans(sampling ?? []);

      setLoading(false);
    }
    load();
  }, []);

  async function loadProcedures(cid: string) {
    const { data } = await supabase.from("audit_program_procedures").select("*").eq("case_id", cid).order("created_at", { ascending: true });
    setProcedures(data ?? []);
  }

  const materialityAmount = (parseFloat(benchmarkAmount || "0") * parseFloat(materialityPct || "0")) / 100;
  const performanceMaterialityAmount = (materialityAmount * parseFloat(performancePct || "0")) / 100;
  const trivialAmount = (materialityAmount * parseFloat(trivialPct || "0")) / 100;

  async function saveMateriality() {
    setMaterialityMessage("");
    if (!caseId || !benchmarkAmount) {
      setMaterialityMessage("Indica el monto base (benchmark) para calcular la materialidad.");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      case_id: caseId,
      benchmark_type: benchmarkType,
      benchmark_amount: parseFloat(benchmarkAmount),
      materiality_percentage: parseFloat(materialityPct),
      materiality_amount: materialityAmount,
      performance_materiality_percentage: parseFloat(performancePct),
      performance_materiality_amount: performanceMaterialityAmount,
      trivial_threshold_amount: trivialAmount,
      notes: notes || null,
      prepared_by: userData?.user?.id ?? null,
      prepared_at: new Date().toISOString(),
    };
    // Una sola materialidad vigente por caso (indice unico en case_id):
    // upsert en vez de siempre insertar, para que recalcular reemplace la
    // anterior en lugar de fallar por duplicado.
    const { error } = await supabase.from("audit_materiality").upsert(payload, { onConflict: "case_id" });
    if (error) { setMaterialityMessage("Error: " + error.message); return; }
    setMaterialityMessage("Materialidad guardada.");
  }

  function updateRiskField(area: string, assertion: string, field: string, value: string) {
    const key = area + "|" + assertion;
    setRiskRows((prev) => {
      const current = prev[key] ?? { area, assertion, inherent_risk: "MEDIO", control_risk: "MEDIO", combined_risk: "MEDIO", planned_response: "" };
      const updated = { ...current, [field]: value };
      if (field === "inherent_risk" || field === "control_risk") {
        updated.combined_risk = suggestCombinedRisk(updated.inherent_risk, updated.control_risk);
      }
      return { ...prev, [key]: updated };
    });
  }

  async function saveRiskRow(area: string, assertion: string) {
    if (!caseId) return;
    const key = area + "|" + assertion;
    const row = riskRows[key];
    if (!row) return;
    setSavingRiskKey(key);
    setRiskMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("audit_risk_assessments").upsert({
      case_id: caseId,
      area,
      assertion,
      inherent_risk: row.inherent_risk,
      control_risk: row.control_risk,
      combined_risk: row.combined_risk,
      planned_response: row.planned_response || null,
      prepared_by: userData?.user?.id ?? null,
    }, { onConflict: "case_id,area,assertion" });
    setSavingRiskKey(null);
    if (error) { setRiskMessage("Error al guardar " + area + " / " + assertion + ": " + error.message); return; }
    setRiskMessage("Guardado.");
  }

  function addArea() {
    if (!newArea.trim()) return;
    setAreas((prev) => Array.from(new Set([...prev, newArea.trim()])));
    setNewArea("");
  }

  async function addProcedure() {
    setProcMessage("");
    if (!caseId || !newProcArea || !newProcDescription.trim()) {
      setProcMessage("Indica el area y la descripcion del procedimiento.");
      return;
    }
    const { error } = await supabase.from("audit_program_procedures").insert([{
      case_id: caseId,
      area: newProcArea,
      assertion: newProcAssertion || null,
      procedure_type: newProcType,
      description: newProcDescription.trim(),
    }]);
    if (error) { setProcMessage("Error: " + error.message); return; }
    setNewProcDescription("");
    await loadProcedures(caseId);
    setProcMessage("Procedimiento agregado.");
  }

  // "Preparar" registra quien ejecuto el procedimiento. Separado de
  // "completar" porque un procedimiento puede estar EN_PROCESO (se empezo
  // a trabajar) sin estar listo para revision todavia.
  async function markPrepared(procId: string) {
    if (!caseId || !currentUserId) return;
    await supabase.from("audit_program_procedures").update({ prepared_by: currentUserId, prepared_at: new Date().toISOString(), status: "EN_PROCESO" }).eq("id", procId);
    await loadProcedures(caseId);
  }

  async function completeProcedure(procId: string, conclusion: string) {
    if (!caseId) return;
    await supabase.from("audit_program_procedures").update({ status: "COMPLETADO", conclusion: conclusion || null }).eq("id", procId);
    await loadProcedures(caseId);
  }

  // La base de datos ya rechaza (constraint) que el revisor sea la misma
  // persona que preparo el procedimiento; este chequeo del lado del
  // cliente es solo para dar un mensaje claro en vez de un error 23514
  // generico de Postgres.
  async function markReviewed(proc: any) {
    if (!caseId || !currentUserId) return;
    if (proc.prepared_by === currentUserId) {
      setProcMessage("No puedes revisar un procedimiento que tu mismo preparaste -- se requiere otra persona para la revision.");
      return;
    }
    const notes = reviewNotesDraft[proc.id] ?? "";
    const { error } = await supabase.from("audit_program_procedures").update({ reviewed_by: currentUserId, reviewed_at: new Date().toISOString(), review_notes: notes || null }).eq("id", proc.id);
    if (error) { setProcMessage("Error al revisar: " + error.message); return; }
    await loadProcedures(caseId);
  }

  // Muestreo por Unidades Monetarias (MUS), asumiendo cero errores
  // esperados en la poblacion -- el metodo estandar para una primera
  // estimacion cuando no hay historico de errores de periodos anteriores.
  // Factores de confiabilidad (distribucion de Poisson, cero errores):
  // ver guia de muestreo de auditoria de AICPA.
  const RELIABILITY_FACTORS: Record<string, number> = { "90": 2.3, "95": 3.0, "99": 4.6 };
  const reliabilityFactor = RELIABILITY_FACTORS[confidenceLevel] ?? 3.0;
  const popAmt = parseFloat(populationAmount || "0");
  const tolMisst = parseFloat(tolerableMisstatement || "0");
  const sampleSize = tolMisst > 0 ? Math.ceil((reliabilityFactor * popAmt) / tolMisst) : 0;
  const samplingInterval = sampleSize > 0 ? popAmt / sampleSize : 0;

  async function saveSamplingPlan() {
    setSamplingMessage("");
    if (!caseId || !samplingArea || !popAmt || !tolMisst) {
      setSamplingMessage("Indica el area, el monto de la poblacion y el error tolerable.");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("audit_sampling_plans").insert([{
      case_id: caseId,
      area: samplingArea,
      population_description: populationDescription || null,
      population_amount: popAmt,
      tolerable_misstatement: tolMisst,
      confidence_level: parseFloat(confidenceLevel),
      reliability_factor: reliabilityFactor,
      sample_size: sampleSize,
      sampling_interval: samplingInterval,
      prepared_by: userData?.user?.id ?? null,
    }]);
    if (error) { setSamplingMessage("Error: " + error.message); return; }
    const { data: sampling } = await supabase.from("audit_sampling_plans").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
    setSamplingPlans(sampling ?? []);
    setSamplingMessage("Plan de muestreo guardado. Tamano de muestra: " + sampleSize + ".");
  }

  const inputStyle: React.CSSProperties = { background: "#11161F", border: "1px solid #1F2937", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 15 };

  if (!caseId) {
    return <div style={{ padding: 20, fontFamily: "monospace", color: "white" }}>Falta el caso. Entra desde el boton "Planificacion" en el Audit Control Center financiero.</div>;
  }
  if (loading) {
    return <div style={{ padding: 20, fontFamily: "monospace", color: "white" }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace", color: "white", maxWidth: 1000 }}>
      <h1>PLANIFICACION DE AUDITORIA</h1>
      <p style={{ color: "#8B93A7" }}>{caseInfo ? caseInfo.case_code + " - " + caseInfo.title : "Caso " + caseId}</p>

      <h2 style={{ marginTop: 32, color: "#60a5fa" }}>Materialidad</h2>
      <p style={{ fontSize: 13, color: "#8B93A7", maxWidth: 700 }}>
        La materialidad es el umbral a partir del cual una diferencia o un hallazgo se considera relevante para ESTE caso. Sin ella, cualquier hallazgo es subjetivo.
        {existingMateriality && " Ya existe una materialidad guardada para este caso -- al recalcular, se reemplaza."}
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <select value={benchmarkType} onChange={(e) => setBenchmarkType(e.target.value)} style={inputStyle}>
          {Object.entries(BENCHMARK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="number" value={benchmarkAmount} onChange={(e) => setBenchmarkAmount(e.target.value)} style={inputStyle} placeholder="Monto base (benchmark)" />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          % Materialidad
          <input type="number" value={materialityPct} onChange={(e) => setMaterialityPct(e.target.value)} style={{ ...inputStyle, width: 70 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          % Materialidad de Ejecucion
          <input type="number" value={performancePct} onChange={(e) => setPerformancePct(e.target.value)} style={{ ...inputStyle, width: 70 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          % Umbral Trivial
          <input type="number" value={trivialPct} onChange={(e) => setTrivialPct(e.target.value)} style={{ ...inputStyle, width: 70 }} />
        </label>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div><strong>Materialidad:</strong> {materialityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div><strong>Materialidad de Ejecucion:</strong> {performanceMaterialityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div><strong>Umbral de Diferencias Triviales:</strong> {trivialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, width: "100%", marginTop: 12, fontFamily: "monospace" }} placeholder="Notas sobre el criterio usado (opcional)" />
      <button onClick={saveMateriality} style={{ marginTop: 10, background: "none", border: "1px solid #60a5fa", color: "#60a5fa", padding: "8px 18px", borderRadius: 8, cursor: "pointer" }}>
        Guardar Materialidad
      </button>
      {materialityMessage && <p style={{ marginTop: 8, color: materialityMessage.startsWith("Error") ? "#f87171" : "#4ade80" }}>{materialityMessage}</p>}

      <h2 style={{ marginTop: 40, color: "#60a5fa" }}>Evaluacion de Riesgo por Asercion</h2>
      <p style={{ fontSize: 13, color: "#8B93A7", maxWidth: 700 }}>
        Para cada area significativa, evalua el riesgo inherente y el riesgo de control en cada una de las 5 aserciones de auditoria (NIA 315). El riesgo combinado se sugiere automaticamente (el mayor de los dos), pero puedes sobreescribirlo si tu juicio profesional difiere.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input value={newArea} onChange={(e) => setNewArea(e.target.value)} style={inputStyle} placeholder="Agregar area (ej: Activos Fijos)" />
        <button onClick={addArea} style={{ background: "none", border: "1px solid #8B93A7", color: "#8B93A7", padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>Agregar</button>
      </div>

      {areas.map((area) => (
        <div key={area} style={{ marginTop: 24 }}>
          <h3 style={{ color: "white", fontSize: 16 }}>{area}</h3>
          <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#8B93A7" }}>
                <th style={{ padding: 6 }}>Asercion</th>
                <th style={{ padding: 6 }}>Riesgo Inherente</th>
                <th style={{ padding: 6 }}>Riesgo de Control</th>
                <th style={{ padding: 6 }}>Riesgo Combinado</th>
                <th style={{ padding: 6 }}>Respuesta Planificada</th>
                <th style={{ padding: 6 }}></th>
              </tr>
            </thead>
            <tbody>
              {ASSERTIONS.map((a) => {
                const key = area + "|" + a.code;
                const row = riskRows[key] ?? { inherent_risk: "MEDIO", control_risk: "MEDIO", combined_risk: "MEDIO", planned_response: "" };
                return (
                  <tr key={key} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 6 }}>{a.label}</td>
                    <td style={{ padding: 6 }}>
                      <select value={row.inherent_risk} onChange={(e) => updateRiskField(area, a.code, "inherent_risk", e.target.value)} style={{ ...inputStyle, padding: "4px 8px", color: RISK_COLOR[row.inherent_risk] }}>
                        {RISK_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <select value={row.control_risk} onChange={(e) => updateRiskField(area, a.code, "control_risk", e.target.value)} style={{ ...inputStyle, padding: "4px 8px", color: RISK_COLOR[row.control_risk] }}>
                        {RISK_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <select value={row.combined_risk} onChange={(e) => updateRiskField(area, a.code, "combined_risk", e.target.value)} style={{ ...inputStyle, padding: "4px 8px", color: RISK_COLOR[row.combined_risk], fontWeight: 700 }}>
                        {RISK_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <input value={row.planned_response} onChange={(e) => updateRiskField(area, a.code, "planned_response", e.target.value)} style={{ ...inputStyle, width: "100%", padding: "4px 8px" }} placeholder="Ej: ampliar muestra" />
                    </td>
                    <td style={{ padding: 6 }}>
                      <button onClick={() => saveRiskRow(area, a.code)} disabled={savingRiskKey === key} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", opacity: savingRiskKey === key ? 0.5 : 1 }}>
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      {riskMessage && <p style={{ marginTop: 12, color: riskMessage.startsWith("Error") ? "#f87171" : "#4ade80" }}>{riskMessage}</p>}

      <h2 style={{ marginTop: 40, color: "#60a5fa" }}>Programa de Auditoria</h2>
      <p style={{ fontSize: 13, color: "#8B93A7", maxWidth: 700 }}>
        Procedimientos planificados por area. Cada uno se prepara (quien lo ejecuto) y se revisa (otra persona distinta -- nadie revisa su propio trabajo).
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <input value={newProcArea} onChange={(e) => setNewProcArea(e.target.value)} style={inputStyle} placeholder="Area" list="planning-areas" />
        <datalist id="planning-areas">
          {areas.map((a) => <option key={a} value={a} />)}
        </datalist>
        <select value={newProcAssertion} onChange={(e) => setNewProcAssertion(e.target.value)} style={inputStyle}>
          <option value="">Asercion (opcional)</option>
          {ASSERTIONS.map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}
        </select>
        <select value={newProcType} onChange={(e) => setNewProcType(e.target.value)} style={inputStyle}>
          <option value="SUSTANTIVA">Sustantiva</option>
          <option value="CONTROL">Control</option>
        </select>
        <input value={newProcDescription} onChange={(e) => setNewProcDescription(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 260 }} placeholder="Descripcion del procedimiento" />
        <button onClick={addProcedure} style={{ background: "none", border: "1px solid #60a5fa", color: "#60a5fa", padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>Agregar Procedimiento</button>
      </div>
      {procMessage && <p style={{ marginTop: 8, color: procMessage.startsWith("Error") || procMessage.startsWith("No puedes") ? "#f87171" : "#4ade80" }}>{procMessage}</p>}

      {procedures.length === 0 ? (
        <p style={{ marginTop: 12, color: "#8B93A7", fontSize: 13 }}>Aun no hay procedimientos.</p>
      ) : (
        <table style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#8B93A7" }}>
              <th style={{ padding: 6 }}>Area</th>
              <th style={{ padding: 6 }}>Asercion</th>
              <th style={{ padding: 6 }}>Tipo</th>
              <th style={{ padding: 6 }}>Descripcion</th>
              <th style={{ padding: 6 }}>Estado</th>
              <th style={{ padding: 6 }}>Preparador</th>
              <th style={{ padding: 6 }}>Revisor</th>
              <th style={{ padding: 6 }}></th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #1F2937" }}>
                <td style={{ padding: 6 }}>{p.area}</td>
                <td style={{ padding: 6 }}>{p.assertion ? ASSERTIONS.find((a) => a.code === p.assertion)?.label ?? p.assertion : "-"}</td>
                <td style={{ padding: 6 }}>{p.procedure_type}</td>
                <td style={{ padding: 6, maxWidth: 240 }}>
                  {p.description}
                  {p.status !== "COMPLETADO" && p.prepared_by && (
                    <div style={{ marginTop: 4 }}>
                      <input
                        value={reviewNotesDraft[p.id] ?? p.conclusion ?? ""}
                        onChange={(e) => setReviewNotesDraft((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Conclusion"
                        style={{ ...inputStyle, width: "100%", padding: "4px 8px", fontSize: 12 }}
                      />
                    </div>
                  )}
                </td>
                <td style={{ padding: 6 }}>{p.status}</td>
                <td style={{ padding: 6 }}>{p.prepared_by ? "Si" : "-"}</td>
                <td style={{ padding: 6 }}>{p.reviewed_by ? "Si" : "-"}</td>
                <td style={{ padding: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {!p.prepared_by && (
                    <button onClick={() => markPrepared(p.id)} style={{ background: "none", border: "1px solid #facc15", color: "#facc15", padding: "4px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Preparar</button>
                  )}
                  {p.prepared_by && p.status !== "COMPLETADO" && (
                    <button onClick={() => completeProcedure(p.id, reviewNotesDraft[p.id] ?? p.conclusion ?? "")} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "4px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Completar</button>
                  )}
                  {p.status === "COMPLETADO" && !p.reviewed_by && (
                    <button onClick={() => markReviewed(p)} style={{ background: "none", border: "1px solid #60a5fa", color: "#60a5fa", padding: "4px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Revisar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 40, color: "#60a5fa" }}>Muestreo (MUS)</h2>
      <p style={{ fontSize: 13, color: "#8B93A7", maxWidth: 700 }}>
        Muestreo por Unidades Monetarias asumiendo cero errores esperados. Calcula el tamano de muestra a partir del monto de la poblacion y el error tolerable (normalmente la materialidad de ejecucion).
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <input value={samplingArea} onChange={(e) => setSamplingArea(e.target.value)} style={inputStyle} placeholder="Area" list="planning-areas" />
        <input value={populationDescription} onChange={(e) => setPopulationDescription(e.target.value)} style={{ ...inputStyle, minWidth: 220 }} placeholder="Descripcion de la poblacion (ej: facturas de venta 2026)" />
        <input type="number" value={populationAmount} onChange={(e) => setPopulationAmount(e.target.value)} style={inputStyle} placeholder="Monto de la poblacion" />
        <input type="number" value={tolerableMisstatement} onChange={(e) => setTolerableMisstatement(e.target.value)} style={inputStyle} placeholder="Error tolerable" />
        <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(e.target.value)} style={inputStyle}>
          <option value="90">90% confianza</option>
          <option value="95">95% confianza</option>
          <option value="99">99% confianza</option>
        </select>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div><strong>Factor de Confiabilidad:</strong> {reliabilityFactor}</div>
        <div><strong>Tamano de Muestra:</strong> {sampleSize || "-"}</div>
        <div><strong>Intervalo de Muestreo:</strong> {samplingInterval ? samplingInterval.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</div>
      </div>
      <button onClick={saveSamplingPlan} style={{ marginTop: 10, background: "none", border: "1px solid #60a5fa", color: "#60a5fa", padding: "8px 18px", borderRadius: 8, cursor: "pointer" }}>
        Guardar Plan de Muestreo
      </button>
      {samplingMessage && <p style={{ marginTop: 8, color: samplingMessage.startsWith("Error") ? "#f87171" : "#4ade80" }}>{samplingMessage}</p>}

      {samplingPlans.length > 0 && (
        <table style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#8B93A7" }}>
              <th style={{ padding: 6 }}>Area</th>
              <th style={{ padding: 6 }}>Poblacion</th>
              <th style={{ padding: 6 }}>Monto</th>
              <th style={{ padding: 6 }}>Error Tolerable</th>
              <th style={{ padding: 6 }}>Confianza</th>
              <th style={{ padding: 6 }}>Tamano de Muestra</th>
              <th style={{ padding: 6 }}>Intervalo</th>
            </tr>
          </thead>
          <tbody>
            {samplingPlans.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1F2937" }}>
                <td style={{ padding: 6 }}>{s.area}</td>
                <td style={{ padding: 6 }}>{s.population_description || "-"}</td>
                <td style={{ padding: 6 }}>{Number(s.population_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: 6 }}>{Number(s.tolerable_misstatement).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: 6 }}>{s.confidence_level}%</td>
                <td style={{ padding: 6 }}>{s.sample_size}</td>
                <td style={{ padding: 6 }}>{Number(s.sampling_interval).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
