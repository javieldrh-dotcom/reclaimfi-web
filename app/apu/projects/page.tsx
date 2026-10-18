"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { calcPartidaCost } from "@/app/core/apu/calcPartida";
import { logCompanyLedgerEvent } from "@/app/lib/logLedgerEvent";

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
  const [pliegoFiles, setPliegoFiles] = useState<File[]>([]);
  const [pliegoAnalyzing, setPliegoAnalyzing] = useState(false);
  const [pliegoResult, setPliegoResult] = useState<any>(null);
  const [pliegoMessage, setPliegoMessage] = useState("");
  const [pliegoSaving, setPliegoSaving] = useState(false);
  const [repName, setRepName] = useState("");
  const [repId, setRepId] = useState("");
  const [repPosition, setRepPosition] = useState("");
  const [repMessage, setRepMessage] = useState("");
  const [repExpanded, setRepExpanded] = useState(false);
  // Antes el 15%/10% de admin/utilidad para las partidas extraidas por IA del
  // pliego quedaba fijo en el codigo, sin importar lo que el usuario realmente
  // quisiera ofertar. Ahora son valores por defecto editables antes de confirmar.
  const [pliegoDefaultAdmin, setPliegoDefaultAdmin] = useState("15");
  const [pliegoDefaultProfit, setPliegoDefaultProfit] = useState("10");

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
        const { data: ar } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("is_active", true).eq("account_type", "ASSET");
        const { data: rev } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("is_active", true).eq("account_type", "REVENUE");
        setArAccounts(ar ?? []);
        setRevenueAccounts(rev ?? []);
        const { data: orderD } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).eq("is_active", true).eq("account_type", "ORDER_DEBTOR").ilike("account_name", "%Contratos por Ejecutar%").single();
        const { data: orderC } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).eq("is_active", true).eq("account_type", "ORDER_CREDITOR").ilike("account_name", "%Responsabilidad por Contratos%").single();
        setOrderDebtorAccount(orderD);
        setOrderCreditorAccount(orderC);
        const { data: compRep } = await supabase.from("companies").select("legal_representative_name, legal_representative_id, legal_representative_position").eq("id", cid).single();
        setRepName(compRep?.legal_representative_name ?? "");
        setRepId(compRep?.legal_representative_id ?? "");
        setRepPosition(compRep?.legal_representative_position ?? "");
        await loadProjects(cid);
      }
    }
    load();
  }, []);
  async function saveRepresentative() {
    setRepMessage("");
    if (!companyId) return;
    const { error } = await supabase.from("companies").update({
      legal_representative_name: repName.trim() || null,
      legal_representative_id: repId.trim() || null,
      legal_representative_position: repPosition.trim() || null,
    }).eq("id", companyId);
    if (error) { setRepMessage("Error: " + error.message); return; }
    setRepMessage("Guardado. Se usara automaticamente en los PDF de ahora en adelante.");
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

  async function analyzePliego() {
    if (pliegoFiles.length === 0) { setPliegoMessage("Selecciona al menos un archivo PDF primero."); return; }
    setPliegoAnalyzing(true);
    setPliegoMessage("");
    setPliegoResult(null);
    try {
      const formData = new FormData();
      pliegoFiles.forEach((f) => formData.append("files", f));
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
      admin_percentage: parseFloat(pliegoDefaultAdmin) || 0,
      profit_percentage: parseFloat(pliegoDefaultProfit) || 0,
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
    setPliegoFiles([]);
    setPliegoSaving(false);
    if (companyId) await loadProjects(companyId);
  }

  // Antes "Marcar como Adjudicado" ejecutaba todo de una vez: una sola persona
  // calculaba el total, registraba el compromiso contractual en Cuentas de
  // Orden y marcaba el proyecto como ADJUDICADO, sin ningun paso intermedio
  // de aprobacion (maker-checker, Fase 2 de la hoja de ruta). Ahora se separa
  // en dos pasos: requestAward() solo valida y deja el proyecto en
  // PENDING_AWARD con una fila en "approvals"; confirmAward() es quien de
  // verdad registra el asiento contable y marca ADJUDICADO. Como hoy solo el
  // rol ADMIN tiene acceso al modulo APU, cualquier ADMIN puede confirmar -
  // incluido quien solicito la adjudicacion - asi que esto funciona como
  // registro explicito y auditable de la decision, no como control de
  // "cuatro ojos" estricto (eso requeriria un segundo ADMIN en la empresa).
  async function requestAward(project: any) {
    if (!window.confirm("Solicitar la adjudicacion de este proyecto? Quedara pendiente de confirmacion antes de registrar el compromiso contractual.")) return;
    if (!companyId) return;

    const { data: partidas } = await supabase.from("apu_partidas").select("*").eq("apu_project_id", project.id);
    const { data: fsclOptions } = await supabase.from("apu_fscl_calculations").select("id, fscl_factor").eq("apu_project_id", project.id);

    let grandTotal = 0;
    for (const p of partidas ?? []) {
      const { data: mats } = await supabase.from("apu_partida_materials").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: equips } = await supabase.from("apu_partida_equipment").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: labs } = await supabase.from("apu_partida_labor").select("quantity, days, daily_rate").eq("apu_partida_id", p.id);
      const fscl = (fsclOptions ?? []).find((f: any) => f.id === p.fscl_calculation_id);
      const c = calcPartidaCost(mats, equips, labs, fscl?.fscl_factor, p.admin_percentage, p.profit_percentage, p.quantity);
      grandTotal += c.total;
    }

    if (grandTotal === 0) {
      alert("Este proyecto no tiene partidas con costos calculados. Agrega partidas antes de adjudicar.");
      return;
    }

    if (!orderDebtorAccount || !orderCreditorAccount) {
      alert("No se encontraron las cuentas de orden \"Contratos por Ejecutar\" y \"Responsabilidad por Contratos Firmados\". Verifica el plan de cuentas.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { error: approvalError } = await supabase.from("approvals").insert([{
      company_id: companyId,
      module: "APU_PROJECT_AWARD",
      record_id: project.id,
      requested_by: userData.user.id,
      status: "PENDING",
    }]);
    if (approvalError) { setMessage("No se pudo crear la solicitud de adjudicacion: " + approvalError.message); return; }

    const { error: statusError } = await supabase.from("apu_projects").update({ status: "PENDING_AWARD" }).eq("id", project.id);
    if (statusError) { setMessage("La solicitud se registro, pero hubo un error al actualizar el estado del proyecto: " + statusError.message); }
    else { setMessage("Adjudicacion solicitada. Queda pendiente de confirmacion por un Administrador antes de registrar el compromiso contractual."); }

    await logCompanyLedgerEvent("rf.apu_project.status_changed", companyId, {
      project_id: project.id, procedure_number: project.procedure_number, from: "DRAFT", to: "PENDING_AWARD",
    });

    await loadProjects(companyId);
  }

  // Recalcula el total (las partidas pudieron cambiar desde que se solicito)
  // y recien aqui se registra el asiento contable real y se marca ADJUDICADO.
  async function confirmAward(project: any) {
    if (!companyId) return;
    if (!window.confirm("Confirmar la adjudicacion de este proyecto y registrar el compromiso contractual?")) return;

    const { data: partidas } = await supabase.from("apu_partidas").select("*").eq("apu_project_id", project.id);
    const { data: fsclOptions } = await supabase.from("apu_fscl_calculations").select("id, fscl_factor").eq("apu_project_id", project.id);

    let grandTotal = 0;
    for (const p of partidas ?? []) {
      const { data: mats } = await supabase.from("apu_partida_materials").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: equips } = await supabase.from("apu_partida_equipment").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: labs } = await supabase.from("apu_partida_labor").select("quantity, days, daily_rate").eq("apu_partida_id", p.id);
      const fscl = (fsclOptions ?? []).find((f: any) => f.id === p.fscl_calculation_id);
      const c = calcPartidaCost(mats, equips, labs, fscl?.fscl_factor, p.admin_percentage, p.profit_percentage, p.quantity);
      grandTotal += c.total;
    }

    if (grandTotal === 0 || !orderDebtorAccount || !orderCreditorAccount) {
      alert("No se pudo confirmar: faltan partidas con costo o las cuentas de orden. Revisa el proyecto antes de confirmar.");
      return;
    }

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Compromiso Contractual - Oferta " + project.procedure_number + " - " + (project.contracting_entity ?? ""),
      entry_date: new Date().toISOString().slice(0, 10),
      entry_number: nextNumber,
    }]).select("id").single();

    if (entryError || !entry) {
      setMessage("No se pudo registrar el compromiso contractual, el proyecto sigue pendiente de confirmacion. Error: " + entryError?.message);
      return;
    }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: orderDebtorAccount.id, debit: grandTotal, credit: 0 },
      { journal_entry_id: entry.id, account_id: orderCreditorAccount.id, debit: 0, credit: grandTotal },
    ]);

    if (linesError) {
      setMessage("No se pudo registrar el compromiso contractual, el proyecto sigue pendiente de confirmacion. Error: " + linesError.message);
      return;
    }

    const { error: statusError } = await supabase.from("apu_projects").update({ status: "AWARDED" }).eq("id", project.id);
    if (statusError) {
      setMessage("El asiento se registro (Nº" + nextNumber + "), pero hubo un error al actualizar el estado del proyecto: " + statusError.message);
      await loadProjects(companyId);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: pendingApproval } = await supabase.from("approvals").select("id").eq("company_id", companyId).eq("module", "APU_PROJECT_AWARD").eq("record_id", project.id).eq("status", "PENDING").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pendingApproval) {
      await supabase.from("approvals").update({ status: "APPROVED", approved_by: userData?.user?.id ?? null }).eq("id", pendingApproval.id);
    }

    await logCompanyLedgerEvent("rf.apu_project.status_changed", companyId, {
      project_id: project.id, procedure_number: project.procedure_number, from: "PENDING_AWARD", to: "AWARDED",
      journal_entry_id: entry.id, entry_number: nextNumber, amount: grandTotal,
    });

    setMessage("Proyecto adjudicado (asiento Nº" + nextNumber + "). Compromiso contractual por " + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " registrado en Cuentas de Orden.");
    await loadProjects(companyId);
  }

  async function rejectAward(project: any) {
    if (!companyId) return;
    if (!window.confirm("Rechazar esta solicitud de adjudicacion? El proyecto volvera a estado DRAFT sin registrar ningun asiento contable.")) return;

    const { data: userData } = await supabase.auth.getUser();
    const { data: pendingApproval } = await supabase.from("approvals").select("id").eq("company_id", companyId).eq("module", "APU_PROJECT_AWARD").eq("record_id", project.id).eq("status", "PENDING").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pendingApproval) {
      await supabase.from("approvals").update({ status: "REJECTED", approved_by: userData?.user?.id ?? null }).eq("id", pendingApproval.id);
    }

    await supabase.from("apu_projects").update({ status: "DRAFT" }).eq("id", project.id);
    await logCompanyLedgerEvent("rf.apu_project.status_changed", companyId, {
      project_id: project.id, procedure_number: project.procedure_number, from: "PENDING_AWARD", to: "DRAFT",
    });
    setMessage("Solicitud de adjudicacion rechazada. El proyecto volvio a estado DRAFT.");
    await loadProjects(companyId);
  }

  // Antes no existia forma de revertir una adjudicacion: si el proyecto se caia o
  // se cancelaba despues de marcarse como ADJUDICADO, el compromiso quedaba
  // registrado en Cuentas de Orden para siempre, sin poder deshacerlo desde aqui.
  // Se busca el asiento original por su descripcion (no se guarda su id en
  // apu_projects) y se genera un asiento de reverso, igual que en el Diario.
  async function unawardProject(project: any) {
    if (!companyId) return;
    if (!window.confirm("Esto revertira la adjudicacion: se creara un asiento de reverso del compromiso contractual en Cuentas de Orden y el proyecto volvera a estado DRAFT. Confirmar?")) return;

    const { data: originalEntry } = await supabase
      .from("journal_entries")
      .select("id, entry_number, journal_lines(account_id, debit, credit)")
      .eq("company_id", companyId)
      .eq("status", "ACTIVE")
      .is("reversed_by_entry_id", null)
      .ilike("description", "Compromiso Contractual - Oferta " + project.procedure_number + "%")
      .order("entry_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!originalEntry) {
      alert("No se encontro automaticamente el asiento original del compromiso contractual (puede haber sido reversado o editado ya). Revisalo manualmente en el Diario antes de cambiar el estado del proyecto.");
      return;
    }

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: newEntry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Reverso Compromiso Contractual - Oferta " + project.procedure_number + " - " + (project.contracting_entity ?? ""),
      entry_date: new Date().toISOString().slice(0, 10),
      entry_number: nextNumber,
      reversal_of_entry_id: originalEntry.id,
    }]).select("id").single();
    if (entryError || !newEntry) { alert("Error al crear el reverso: " + entryError?.message); return; }

    const reversedLines = (originalEntry.journal_lines ?? []).map((l: any) => ({
      journal_entry_id: newEntry.id,
      account_id: l.account_id,
      debit: l.credit || 0,
      credit: l.debit || 0,
    }));
    const { error: revLinesError } = await supabase.from("journal_lines").insert(reversedLines);
    if (revLinesError) { alert("Error al guardar las lineas del asiento: " + revLinesError.message); return; }
    await supabase.from("journal_entries").update({ reversed_by_entry_id: newEntry.id }).eq("id", originalEntry.id);

    await supabase.from("apu_projects").update({ status: "DRAFT" }).eq("id", project.id);

    setMessage("Adjudicacion revertida (reverso Nº" + nextNumber + "). El proyecto volvio a estado DRAFT.");
    if (companyId) await loadProjects(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="apu" title="Licitaciones y Ofertas al Estado" subtitle="Modulo de Analisis de Precios Unitarios (APU) - Aplicable a cualquier pais o moneda" fullWidth>
      <div style={{ ...theme.cardStyle, maxWidth: 900, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setRepExpanded(!repExpanded)}>
          <h3 style={{ fontSize: 15, color: theme.accent, fontWeight: 700 }}>
            Datos del Representante Legal (para firma en PDF) {repName && "- " + repName}
          </h3>
          <span style={{ fontSize: 12, color: theme.accent }}>{repExpanded ? "Ocultar" : "Editar"}</span>
        </div>
        {repExpanded && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={repName} onChange={(e) => setRepName(e.target.value)} style={{ ...theme.inputStyle, flex: 1, minWidth: 200 }} placeholder="Nombre y Apellido" />
              <input value={repId} onChange={(e) => setRepId(e.target.value)} style={{ ...theme.inputStyle, flex: 1, minWidth: 150 }} placeholder="Cedula de Identidad" />
              <input value={repPosition} onChange={(e) => setRepPosition(e.target.value)} style={{ ...theme.inputStyle, flex: 1, minWidth: 180 }} placeholder="Cargo / Representante Legal" />
            </div>
            <button onClick={saveRepresentative} style={{ ...theme.buttonStyle, marginTop: 10, padding: "8px 16px", fontSize: 13 }}>Guardar</button>
            {repMessage && <p style={{ marginTop: 8, fontSize: 12, color: repMessage.includes("Error") ? "#f87171" : theme.accent }}>{repMessage}</p>}
          </div>
        )}
      </div>
      <div style={{ ...theme.cardStyle, maxWidth: 900, margin: "0 auto 24px", border: "1px solid " + theme.accent }}>
        <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>Crear Proyecto desde Pliego (PDF)</h3>
        <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 12 }}>
          Sube el pliego licitatorio. La IA extraera el proyecto y todas las partidas para que las revises antes de guardar.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept="application/pdf" multiple onChange={(e) => setPliegoFiles(Array.from(e.target.files ?? []))} style={{ ...theme.inputStyle, flex: 1, minWidth: 220 }} />
          <button onClick={analyzePliego} disabled={pliegoAnalyzing || pliegoFiles.length === 0} style={{ ...theme.buttonStyle, padding: "10px 20px", opacity: pliegoAnalyzing || pliegoFiles.length === 0 ? 0.6 : 1 }}>
            {pliegoAnalyzing ? "Analizando..." : "Analizar Pliego con IA"}
          </button>
        </div>
        {pliegoFiles.length > 0 && (
          <p style={{ marginTop: 8, fontSize: 12, color: "#8B93A7" }}>{pliegoFiles.length} archivo(s) seleccionado(s): {pliegoFiles.map((f) => f.name).join(", ")}</p>
        )}
        {pliegoMessage && <p style={{ marginTop: 10, fontSize: 13, color: pliegoMessage.includes("Error") ? "#f87171" : theme.accent }}>{pliegoMessage}</p>}

        {pliegoResult && (
          <div style={{ marginTop: 20, borderTop: "1px solid " + theme.border, paddingTop: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginBottom: 10 }}>
              Revisa antes de confirmar (confianza: {pliegoResult.confidence})
            </p>
            <input value={pliegoResult.procedureNumber || ""} onChange={(e) => updatePliegoField("procedureNumber", e.target.value)} style={{ ...theme.inputStyle, marginBottom: 8 }} placeholder="Numero de procedimiento" />
            <input value={pliegoResult.projectDescription || ""} onChange={(e) => updatePliegoField("projectDescription", e.target.value)} style={{ ...theme.inputStyle, marginBottom: 8 }} placeholder="Descripcion del proyecto" />
            <input value={pliegoResult.contractingEntity || ""} onChange={(e) => updatePliegoField("contractingEntity", e.target.value)} style={{ ...theme.inputStyle, marginBottom: 12 }} placeholder="Ente contratante" />

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#8B93A7" }}>Admin % (todas las partidas)</label>
              <input type="number" value={pliegoDefaultAdmin} onChange={(e) => setPliegoDefaultAdmin(e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 80 }} />
              <label style={{ fontSize: 13, color: "#8B93A7" }}>Utilidad % (todas las partidas)</label>
              <input type="number" value={pliegoDefaultProfit} onChange={(e) => setPliegoDefaultProfit(e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 80 }} />
            </div>

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
                <span style={{ fontSize: 16, color: p.status === "AWARDED" ? "#4ade80" : p.status === "PENDING_AWARD" ? "#facc15" : "#8B93A7", fontWeight: 700 }}>
                  {p.status === "PENDING_AWARD" ? "PENDIENTE DE APROBACION" : p.status}
                </span>
                {p.status === "DRAFT" && (
                  <button onClick={() => requestAward(p)} style={{ padding: "8px 16px", background: "none", border: "1px solid #4ade80", color: "#4ade80", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                    Solicitar Adjudicacion
                  </button>
                )}
                {p.status === "PENDING_AWARD" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => confirmAward(p)} style={{ padding: "8px 16px", background: "none", border: "1px solid #4ade80", color: "#4ade80", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                      Confirmar y Registrar
                    </button>
                    <button onClick={() => rejectAward(p)} style={{ padding: "8px 16px", background: "none", border: "1px solid #f87171", color: "#f87171", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                      Rechazar
                    </button>
                  </div>
                )}
                {p.status === "AWARDED" && (
                  <button onClick={() => unawardProject(p)} style={{ padding: "8px 16px", background: "none", border: "1px solid #f87171", color: "#f87171", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                    Revertir Adjudicacion
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
