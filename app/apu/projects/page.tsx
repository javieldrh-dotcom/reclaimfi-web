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

    setMessage("Proyecto adjudicado. Compromiso contractual por " + grandTotal.toLocaleString() + " registrado en Cuentas de Orden.");
    if (companyId) await loadProjects(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="apu" title="Licitaciones y Ofertas al Estado" subtitle="Modulo de Analisis de Precios Unitarios (APU) - Aplicable a cualquier pais o moneda" fullWidth>
      <div style={{ maxWidth: 600 }}>
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
