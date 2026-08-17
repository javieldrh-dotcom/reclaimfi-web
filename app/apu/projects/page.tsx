"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function ApuProjectsPage() {
  const theme = getVerticalTheme("apu");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [procedureNumber, setProcedureNumber] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [contractingEntity, setContractingEntity] = useState("");
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [arAccounts, setArAccounts] = useState<any[]>([]);
  const [revenueAccounts, setRevenueAccounts] = useState<any[]>([]);
  const [orderDebtorAccount, setOrderDebtorAccount] = useState<any>(null);
  const [orderCreditorAccount, setOrderCreditorAccount] = useState<any>(null);
  const [pliegoFile, setPliegoFile] = useState<File | null>(null);
  const [pliegoAnalyzing, setPliegoAnalyzing] = useState(false);
  const [pliegoResult, setPliegoResult] = useState<any>(null);
  const [pliegoMessage, setPliegoMessage] = useState("");
  const [pliegoSaving, setPliegoSaving] = useState(false);

  async function loadProjects(cid: string) {
    const { data } = await supabase.from("apu_projects").select("*").eq("company_id", cid).order("created_at", { ascending: false });
    setProjects(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: ar } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "ASSET");
        const { data: rev } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "REVENUE");
        setArAccounts(ar ?? []);
        setRevenueAccounts(rev ?? []);
        const { data: orderD } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).eq("account_type", "ORDER_DEBTOR").ilike("account_name", "%Contratos por Ejecutar%").single();
        const { data: orderC } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).eq("account_type", "ORDER_CREDITOR").ilike("account_name", "%Responsabilidad por Contratos%").single();
        setOrderDebtorAccount(orderD);
        setOrderCreditorAccount(orderC);
        await loadProjects(cid);
      }
    }
    load();
  }, []);
  async function createProject() {
    setMessage("");
    if (!companyId || !procedureNumber) { setMessage("Completa al menos el numero de procedimiento."); return; }

    const { error } = await supabase.from("apu_projects").insert([{
      company_id: companyId,
      procedure_number: procedureNumber,
      project_description: projectDescription,
      contracting_entity: contractingEntity,
      submission_date: submissionDate,
      status: "DRAFT",
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Proyecto creado correctamente.");
    setProcedureNumber(""); setProjectDescription(""); setContractingEntity("");
    if (companyId) await loadProjects(companyId);
  }

  async function analyzePliego() {
    if (!pliegoFile) { setPliegoMessage("Selecciona un archivo PDF primero."); return; }
    setPliegoAnalyzing(true);
    setPliegoMessage("");
    setPliegoResult(null);
    try {
      const formData = new FormData();
      formData.append("file", pliegoFile);
      const res = await fetch("/api/extract-pliego", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setPliegoMessage(json.error || "No se pudo analizar el pliego.");
      } else {
        setPliegoResult(json.data);
        if (json.data.warnings && json.data.warnings.length > 0) {
          setPliegoMessage("Revisa antes de confirmar: " + json.data.warnings.join(" | "));
        }
      }
    } catch (e: any) {
      setPliegoMessage("Error: " + e.message);
    }
    setPliegoAnalyzing(false);
  }

  function updatePliegoField(field: string, value: string) {
    setPliegoResult((prev: any) => ({ ...prev, [field]: value }));
  }

  function updatePliegoPartida(index: number, field: string, value: string) {
    setPliegoResult((prev: any) => {
      const partidas = [...prev.partidas];
      partidas[index] = { ...partidas[index], [field]: field === "quantity" ? parseFloat(value) || 0 : value };
      return { ...prev, partidas };
    });
  }

  function removePliegoPartida(index: number) {
    setPliegoResult((prev: any) => ({ ...prev, partidas: prev.partidas.filter((_: any, i: number) => i !== index) }));
  }

  async function confirmPliegoProject() {
    if (!pliegoResult || !companyId) return;
    setPliegoSaving(true);
    setPliegoMessage("");
    const { data: newProject, error: projError } = await supabase.from("apu_projects").insert([{
      company_id: companyId,
      procedure_number: pliegoResult.procedureNumber || "SIN-NUMERO",
      project_description: pliegoResult.projectDescription,
      contracting_entity: pliegoResult.contractingEntity,
      status: "DRAFT",
    }]).select("id").single();

    if (projError || !newProject) {
      setPliegoMessage("Error al crear el proyecto: " + projError?.message);
      setPliegoSaving(false);
      return;
    }

    const partidasToInsert = (pliegoResult.partidas || []).map((p: any, i: number) => ({
      apu_project_id: newProject.id,
      item_number: i + 1,
      code: p.code || null,
      description: p.description,
      unit: p.unit,
      quantity: p.quantity || 0,
      admin_percentage: 15,
      profit_percentage: 10,
    }));

    if (partidasToInsert.length > 0) {
      const { error: partError } = await supabase.from("apu_partidas").insert(partidasToInsert);
      if (partError) {
        setPliegoMessage("Proyecto creado, pero hubo un error al cargar las partidas: " + partError.message);
        setPliegoSaving(false);
        if (companyId) await loadProjects(companyId);
        return;
      }
    }

    setPliegoMessage("Proyecto y " + partidasToInsert.length + " partidas creadas correctamente.");
    setPliegoResult(null);
    setPliegoFile(null);
    setPliegoSaving(false);
    if (companyId) await loadProjects(companyId);
  }

  async function awardProject(project: any) {
    if (!window.confirm("Marcar este proyecto como ADJUDICADO y registrar el compromiso contractual?")) return;

    const { data: partidas } = await supabase.from("apu_partidas").select("*").eq("apu_project_id", project.id);

    let grandTotal = 0;
    for (const p of partidas ?? []) {
      const { data: mats } = await supabase.from("apu_partida_materials").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: equips } = await supabase.from("apu_partida_equipment").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: labs } = await supabase.from("apu_partida_labor").select("quantity, days, daily_rate").eq("apu_partida_id", p.id);
      const materialsCost = (mats ?? []).reduce((s: number, m: any) => s + (m.quantity || 0) * (m.unit_cost || 0), 0);
      const equipmentCost = (equips ?? []).reduce((s: number, e: any) => s + (e.quantity || 0) * (e.unit_cost || 0), 0);
      const laborCost = (labs ?? []).reduce((s: number, l: any) => s + (l.quantity || 0) * (l.days || 0) * (l.daily_rate || 0), 0);
      const directCost = materialsCost + equipmentCost + laborCost;
      const admin = directCost * ((p.admin_percentage || 0) / 100);
      const profit = directCost * ((p.profit_percentage || 0) / 100);
      grandTotal += (directCost + admin + profit) * (p.quantity || 0);
    }

    if (grandTotal === 0) {
      alert("Este proyecto no tiene partidas con costos calculados. Agrega partidas antes de adjudicar.");
      return;
    }

    if (!orderDebtorAccount || !orderCreditorAccount) {
      alert("No se encontraron las cuentas de orden \"Contratos por Ejecutar\" y \"Responsabilidad por Contratos Firmados\". Verifica el plan de cuentas.");
      return;
    }

    await supabase.from("apu_projects").update({ status: "AWARDED" }).eq("id", project.id);

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Compromiso Contractual - Oferta " + project.procedure_number + " - " + (project.contracting_entity ?? ""),
      entry_date: new Date().toISOString().slice(0, 10),
    }]).select("id").single();

    if (entryError || !entry) {
      setMessage("Proyecto adjudicado, pero hubo un error al generar el asiento: " + entryError?.message);
      if (companyId) await loadProjects(companyId);
      return;
    }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: orderDebtorAccount.id, debit: grandTotal, credit: 0 },
      { journal_entry_id: entry.id, account_id: orderCreditorAccount.id, debit: 0, credit: grandTotal },
    ]);

    setMessage("Proyecto adjudicado. Compromiso contractual por " + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " registrado en Cuentas de Orden.");
    if (companyId) await loadProjects(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="apu" title="Licitaciones y Ofertas al Estado" subtitle="Modulo de Analisis de Precios Unitarios (APU) - Aplicable a cualquier pais o moneda" fullWidth>
      <div style={{ ...theme.cardStyle, maxWidth: 900, margin: "0 auto 24px", border: "1px solid " + theme.accent }}>
        <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>Crear Proyecto desde Pliego (PDF)</h3>
        <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 12 }}>
          Sube el pliego licitatorio. La IA extraera el proyecto y todas las partidas para que las revises antes de guardar.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept="application/pdf" onChange={(e) => setPliegoFile(e.target.files?.[0] ?? null)} style={{ ...theme.inputStyle, flex: 1, minWidth: 220 }} />
          <button onClick={analyzePliego} disabled={pliegoAnalyzing || !pliegoFile} style={{ ...theme.buttonStyle, padding: "10px 20px", opacity: pliegoAnalyzing || !pliegoFile ? 0.6 : 1 }}>
            {pliegoAnalyzing ? "Analizando..." : "Analizar Pliego con IA"}
          </button>
        </div>
        {pliegoMessage && <p style={{ marginTop: 10, fontSize: 13, color: pliegoMessage.includes("Error") ? "#f87171" : theme.accent }}>{pliegoMessage}</p>}

        {pliegoResult && (
          <div style={{ marginTop: 20, borderTop: "1px solid " + theme.border, paddingTop: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginBottom: 10 }}>
              Revisa antes de confirmar (confianza: {pliegoResult.confidence})
            </p>
            <input value={pliegoResult.procedureNumber || ""} onChange={(e) => updatePliegoField("procedureNumber", e.target.value)} style={{ ...theme.inputStyle, marginBottom: 8 }} placeholder="Numero de procedimiento" />
            <input value={pliegoResult.projectDescription || ""} onChange={(e) => updatePliegoField("projectDescription", e.target.value)} style={{ ...theme.inputStyle, marginBottom: 8 }} placeholder="Descripcion del proyecto" />
            <input value={pliegoResult.contractingEntity || ""} onChange={(e) => updatePliegoField("contractingEntity", e.target.value)} style={{ ...theme.inputStyle, marginBottom: 12 }} placeholder="Ente contratante" />

            <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 8 }}>{(pliegoResult.partidas || []).length} partidas encontradas:</p>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {(pliegoResult.partidas || []).map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input value={p.code || ""} onChange={(e) => updatePliegoPartida(i, "code", e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 90 }} placeholder="Codigo" />
                  <input value={p.description || ""} onChange={(e) => updatePliegoPartida(i, "description", e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, flex: 1 }} placeholder="Descripcion" />
                  <input value={p.unit || ""} onChange={(e) => updatePliegoPartida(i, "unit", e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 70 }} placeholder="Unidad" />
                  <input type="number" value={p.quantity ?? ""} onChange={(e) => updatePliegoPartida(i, "quantity", e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 90 }} placeholder="Cantidad" />
                  <button onClick={() => removePliegoPartida(i)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>x</button>
                </div>
              ))}
            </div>
            <button onClick={confirmPliegoProject} disabled={pliegoSaving} style={{ ...theme.buttonStyle, marginTop: 14, opacity: pliegoSaving ? 0.6 : 1 }}>
              {pliegoSaving ? "Guardando..." : "Confirmar y Crear Proyecto con " + (pliegoResult.partidas || []).length + " Partidas"}
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <input value={procedureNumber} onChange={(e) => setProcedureNumber(e.target.value)} style={inputStyle} placeholder="Numero de procedimiento/licitacion" />
        <input value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Descripcion del proyecto/obra" />
        <input value={contractingEntity} onChange={(e) => setContractingEntity(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Ente contratante" />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Fecha de Presentacion de la Oferta</label>
        <input type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <button onClick={createProject} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          CREAR PROYECTO
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {projects.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Proyectos Registrados</h2>
          {projects.map((p) => (
            <div key={p.id} style={{ ...theme.cardStyle, marginTop: 12 }}>
              <Link href={"/apu/partidas/" + p.id} style={{ color: theme.accent, fontWeight: 700, fontSize: 22, textDecoration: "none" }}>
                {p.procedure_number}
              </Link>
              <p style={{ fontSize: 18, color: "#B0B8C8", marginTop: 4 }}>{p.project_description} - {p.contracting_entity}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 16, color: p.status === "AWARDED" ? "#4ade80" : "#facc15", fontWeight: 700 }}>{p.status}</span>
                {p.status === "DRAFT" && (
                  <button onClick={() => awardProject(p)} style={{ padding: "8px 16px", background: "none", border: "1px solid #4ade80", color: "#4ade80", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                    Marcar como Adjudicado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
