"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function ApuProjectsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [procedureNumber, setProcedureNumber] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [contractingEntity, setContractingEntity] = useState("");
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("USD");
  const [message, setMessage] = useState("");
  const [arAccounts, setArAccounts] = useState<any[]>([]);
  const [revenueAccounts, setRevenueAccounts] = useState<any[]>([]);

  async function loadProjects(cid: string) {
    const { data } = await supabase.from("apu_projects").select("*").eq("company_id", cid).order("created_at", { ascending: false });
    setProjects(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: ar } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "ASSET");
        const { data: rev } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "REVENUE");
        setArAccounts(ar ?? []);
        setRevenueAccounts(rev ?? []);
        await loadProjects(cid);
      }
    }
    load();
  }, []);

  async function awardProject(project: any) {
    if (!window.confirm("Marcar este proyecto como ADJUDICADO y generar la factura por cobrar automaticamente?")) return;

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

    if (arAccounts.length === 0 || revenueAccounts.length === 0) {
      alert("No hay cuentas de Activo o Ingreso configuradas en el plan de cuentas de esta empresa.");
      return;
    }

    await supabase.from("apu_projects").update({ status: "AWARDED" }).eq("id", project.id);

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Adjudicacion de Oferta " + project.procedure_number + " - " + (project.contracting_entity ?? ""),
      entry_date: new Date().toISOString().slice(0, 10),
    }]).select("id").single();

    if (entryError || !entry) {
      setMessage("Proyecto adjudicado, pero hubo un error al generar el asiento: " + entryError?.message);
      if (companyId) await loadProjects(companyId);
      return;
    }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: arAccounts[0].id, debit: grandTotal, credit: 0 },
      { journal_entry_id: entry.id, account_id: revenueAccounts[0].id, debit: 0, credit: grandTotal },
    ]);

    await supabase.from("ar_invoices").insert([{
      company_id: companyId,
      customer_name: project.contracting_entity ?? "Cliente",
      invoice_number: project.procedure_number,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      amount: grandTotal,
      journal_entry_id: entry.id,
    }]);

    setMessage("Proyecto adjudicado. Factura por " + grandTotal.toLocaleString() + " generada automaticamente en Cuentas por Cobrar, con su asiento contable.");
    if (companyId) await loadProjects(companyId);
  }

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

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%" };
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Licitaciones y Ofertas al Estado</h1>
      <p style={{ marginTop: 8, color: "#9ca3af", fontSize: 12 }}>
        Modulo de Analisis de Precios Unitarios (APU) - Aplicable a cualquier pais o moneda.
      </p>

      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 500 }}>
        <input value={procedureNumber} onChange={(e) => setProcedureNumber(e.target.value)} style={inputStyle} placeholder="Numero de procedimiento/licitacion" />
        <input value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} style={inputStyle} placeholder="Descripcion del proyecto/obra" />
        <input value={contractingEntity} onChange={(e) => setContractingEntity(e.target.value)} style={inputStyle} placeholder="Ente contratante" />
        <div>
          <label style={{ fontSize: 12, color: "#7dd3fc" }}>FECHA DE PRESENTACION DE LA OFERTA</label>
          <input type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </div>
        <button onClick={createProject} style={{ padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
          CREAR PROYECTO
        </button>
        {message && <p style={{ color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>}
      </div>

      {projects.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Proyectos Registrados</h2>
          {projects.map((p) => (
            <div key={p.id} style={{ padding: 12, borderBottom: "1px solid #1a3050" }}>
              <Link href={"/apu/partidas/" + p.id} style={{ color: "#7dd3fc", fontWeight: 700 }}>
                {p.procedure_number}
              </Link>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>{p.project_description} - {p.contracting_entity}</p>
              <span style={{ fontSize: 11, color: p.status === "AWARDED" ? "#4ade80" : "#facc15" }}>{p.status}</span>
              {p.status === "DRAFT" && (
                <button onClick={() => awardProject(p)} style={{ marginLeft: 12, padding: "4px 12px", background: "none", border: "1px solid #4ade80", color: "#4ade80", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                  Marcar como Adjudicado
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
