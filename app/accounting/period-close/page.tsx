"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { logCompanyLedgerEvent } from "@/app/lib/logLedgerEvent";

export default function PeriodClosePage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [revenueAccounts, setRevenueAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [retainedEarningsId, setRetainedEarningsId] = useState<string | null>(null);
  const [profitLossAccountId, setProfitLossAccountId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPeriods(cid: string) {
    const { data } = await supabase.from("fiscal_periods").select("*").eq("company_id", cid).order("period_end", { ascending: false });
    setPeriods(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: rev } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "REVENUE");
        const { data: exp } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "EXPENSE");
        const { data: re } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).ilike("account_name", "%Resultados Acumulados%").limit(1).single();
        setRevenueAccounts(rev ?? []);
        setExpenseAccounts(exp ?? []);
        setRetainedEarningsId(re?.id ?? null);
        let { data: pyg } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).ilike("account_name", "%Perdidas y Ganancias%").limit(1).maybeSingle();
        if (!pyg) { const alt = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).ilike("account_name", "%P%rdidas y Ganancias%").limit(1).maybeSingle(); pyg = alt.data; }
        if (!pyg) {
          const { data: created } = await supabase.from("chart_of_accounts").insert([{ company_id: cid, account_code: "3199-01", account_name: "Perdidas y Ganancias (Cuenta Puente de Cierre)", account_type: "EQUITY" }]).select("id").single();
          pyg = created;
        }
        setProfitLossAccountId(pyg?.id ?? null);
        await loadPeriods(cid);
      }
    }
    load();
  }, []);

  // Antes "Ejecutar Cierre de Ejercicio" calculaba y registraba los 3 asientos
  // NIIF de una sola vez, sin ningun paso de confirmacion - la accion mas
  // irreversible y de mayor impacto de todo el modulo contable (cierra
  // Ingresos/Gastos y traslada el resultado a Patrimonio) no tenia ni
  // siquiera un boton de deshacer. Ahora se separa en dos pasos
  // (maker-checker, Fase 2 de la hoja de ruta), igual patron que la
  // adjudicacion APU: requestClose() solo valida y deja una fila en
  // fiscal_periods con status PENDING_CLOSE + una solicitud en "approvals";
  // confirmClose() es quien de verdad registra los 3 asientos. Como hoy solo
  // ADMIN/CONTADOR tienen EDIT_ACCOUNTING, cualquiera de esos roles puede
  // confirmar, incluido quien solicito el cierre - esto deja un registro
  // explicito y auditable de la decision.
  async function computeCloseTotals(pStart: string, pEnd: string) {
    const revenueIds = revenueAccounts.map((a) => a.id);
    const expenseIds = expenseAccounts.map((a) => a.id);

    const { data: revLines } = await supabase.from("journal_lines").select("debit, credit, account_id, journal_entries!inner(entry_date, status)").in("account_id", revenueIds).eq("journal_entries.status", "ACTIVE").gte("journal_entries.entry_date", pStart).lte("journal_entries.entry_date", pEnd);
    const { data: expLines } = await supabase.from("journal_lines").select("debit, credit, account_id, journal_entries!inner(entry_date, status)").in("account_id", expenseIds).eq("journal_entries.status", "ACTIVE").gte("journal_entries.entry_date", pStart).lte("journal_entries.entry_date", pEnd);

    const revenueByAccount: Record<string, number> = {};
    (revLines ?? []).forEach((l: any) => {
      revenueByAccount[l.account_id] = (revenueByAccount[l.account_id] || 0) + ((l.credit || 0) - (l.debit || 0));
    });

    const expenseByAccount: Record<string, number> = {};
    (expLines ?? []).forEach((l: any) => {
      expenseByAccount[l.account_id] = (expenseByAccount[l.account_id] || 0) + ((l.debit || 0) - (l.credit || 0));
    });

    const totalRevenue = Object.values(revenueByAccount).reduce((s, v) => s + v, 0);
    const totalExpense = Object.values(expenseByAccount).reduce((s, v) => s + v, 0);
    return { revenueByAccount, expenseByAccount, totalRevenue, totalExpense, netResult: totalRevenue - totalExpense };
  }

  async function requestClose() {
    setMessage("");
    setLoading(true);

    if (!companyId || !periodStart || !periodEnd) { setMessage("Completa las fechas del periodo."); setLoading(false); return; }
    if (!retainedEarningsId) { setMessage("No se encontro la cuenta de Resultados Acumulados."); setLoading(false); return; }
    if (!profitLossAccountId) { setMessage("No se pudo crear o encontrar la cuenta puente Perdidas y Ganancias."); setLoading(false); return; }

    const { totalRevenue, totalExpense } = await computeCloseTotals(periodStart, periodEnd);
    if (totalRevenue === 0 && totalExpense === 0) {
      setMessage("No hay movimientos de Ingresos/Gastos en este periodo para cerrar.");
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { setLoading(false); return; }

    const { data: periodRow, error: periodError } = await supabase.from("fiscal_periods").insert([{
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "PENDING_CLOSE",
    }]).select("id").single();
    if (periodError || !periodRow) { setMessage("No se pudo registrar la solicitud de cierre: " + periodError?.message); setLoading(false); return; }

    const { error: approvalError } = await supabase.from("approvals").insert([{
      company_id: companyId,
      module: "PERIOD_CLOSE",
      record_id: periodRow.id,
      requested_by: userData.user.id,
      status: "PENDING",
    }]);
    if (approvalError) { setMessage("El periodo quedo registrado como pendiente, pero hubo un error al crear la solicitud de aprobacion: " + approvalError.message); }
    else { setMessage("Cierre solicitado. Queda pendiente de confirmacion antes de registrar los asientos de cierre."); }

    setLoading(false);
    await loadPeriods(companyId);
  }

  async function confirmClose(period: any) {
    if (!companyId) return;
    if (!window.confirm("Confirmar el cierre de este periodo y registrar los 3 asientos NIIF? Esta accion no se puede deshacer desde aqui.")) return;
    setLoading(true);

    const { totalRevenue, totalExpense, netResult, revenueByAccount, expenseByAccount } = await computeCloseTotals(period.period_start, period.period_end);
    if (totalRevenue === 0 && totalExpense === 0) {
      setMessage("Ya no hay movimientos de Ingresos/Gastos en este periodo. No se confirmo el cierre.");
      setLoading(false);
      return;
    }

    async function nextEntryNumber() {
      const { data: last } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId!).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
      return (last?.entry_number || 0) + 1;
    }

    const num1 = await nextEntryNumber();
    const { data: entry1, error: e1 } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Cierre de Cuentas de Ingresos - " + period.period_start + " a " + period.period_end,
      entry_date: period.period_end,
      entry_number: num1,
    }]).select("id").single();
    if (e1 || !entry1) { setMessage("Error asiento 1: " + e1?.message); setLoading(false); return; }
    const lines1: any[] = [];
    Object.entries(revenueByAccount).forEach(([accId, amount]) => {
      if (amount !== 0) lines1.push({ journal_entry_id: entry1.id, account_id: accId, debit: amount, credit: 0 });
    });
    lines1.push({ journal_entry_id: entry1.id, account_id: profitLossAccountId, debit: 0, credit: totalRevenue });
    await supabase.from("journal_lines").insert(lines1);

    const num2 = num1 + 1;
    const { data: entry2, error: e2 } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Cierre de Cuentas de Gastos y Costos - " + period.period_start + " a " + period.period_end,
      entry_date: period.period_end,
      entry_number: num2,
    }]).select("id").single();
    if (e2 || !entry2) { setMessage("Error asiento 2: " + e2?.message); setLoading(false); return; }
    const lines2: any[] = [];
    lines2.push({ journal_entry_id: entry2.id, account_id: profitLossAccountId, debit: totalExpense, credit: 0 });
    Object.entries(expenseByAccount).forEach(([accId, amount]) => {
      if (amount !== 0) lines2.push({ journal_entry_id: entry2.id, account_id: accId, debit: 0, credit: amount });
    });
    await supabase.from("journal_lines").insert(lines2);

    const num3 = num2 + 1;
    const { data: entry3, error: e3 } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Traspaso del Resultado Neto a Patrimonio - " + period.period_start + " a " + period.period_end,
      entry_date: period.period_end,
      entry_number: num3,
    }]).select("id").single();
    if (e3 || !entry3) { setMessage("Error asiento 3: " + e3?.message); setLoading(false); return; }
    const lines3: any[] = [];
    if (netResult >= 0) {
      lines3.push({ journal_entry_id: entry3.id, account_id: profitLossAccountId, debit: netResult, credit: 0 });
      lines3.push({ journal_entry_id: entry3.id, account_id: retainedEarningsId, debit: 0, credit: netResult });
    } else {
      lines3.push({ journal_entry_id: entry3.id, account_id: retainedEarningsId, debit: Math.abs(netResult), credit: 0 });
      lines3.push({ journal_entry_id: entry3.id, account_id: profitLossAccountId, debit: 0, credit: Math.abs(netResult) });
    }
    await supabase.from("journal_lines").insert(lines3);

    await supabase.from("fiscal_periods").update({
      status: "CLOSED",
      closing_entry_id: entry3.id,
      closed_at: new Date().toISOString(),
      net_result: netResult,
    }).eq("id", period.id);

    const { data: userData } = await supabase.auth.getUser();
    const { data: pendingApproval } = await supabase.from("approvals").select("id").eq("company_id", companyId).eq("module", "PERIOD_CLOSE").eq("record_id", period.id).eq("status", "PENDING").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pendingApproval) {
      await supabase.from("approvals").update({ status: "APPROVED", approved_by: userData?.user?.id ?? null }).eq("id", pendingApproval.id);
    }

    // Fase 5: cadena de custodia unificada - dos eventos encadenados por
    // empresa (no hay caso forense involucrado): la decision de aprobar,
    // y el resultado concreto del cierre (asientos + resultado neto).
    await logCompanyLedgerEvent("rf.period.close_approved", companyId, {
      period_id: period.id, period_start: period.period_start, period_end: period.period_end,
    });
    await logCompanyLedgerEvent("rf.period.closed", companyId, {
      period_id: period.id, period_start: period.period_start, period_end: period.period_end,
      net_result: netResult, entry_numbers: [num1, num2, num3],
    });

    setMessage("Periodo cerrado correctamente con 3 asientos NIIF (Nº" + num1 + ", " + num2 + ", " + num3 + "). Resultado: " + netResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setLoading(false);
    await loadPeriods(companyId);
  }

  async function rejectClose(period: any) {
    if (!companyId) return;
    if (!window.confirm("Rechazar esta solicitud de cierre? No se registrara ningun asiento y la solicitud se eliminara.")) return;

    const { data: userData } = await supabase.auth.getUser();
    const { data: pendingApproval } = await supabase.from("approvals").select("id").eq("company_id", companyId).eq("module", "PERIOD_CLOSE").eq("record_id", period.id).eq("status", "PENDING").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pendingApproval) {
      await supabase.from("approvals").update({ status: "REJECTED", approved_by: userData?.user?.id ?? null }).eq("id", pendingApproval.id);
    }

    await supabase.from("fiscal_periods").delete().eq("id", period.id);
    await logCompanyLedgerEvent("rf.period.close_rejected", companyId, {
      period_start: period.period_start, period_end: period.period_end,
    });
    setMessage("Solicitud de cierre rechazada.");
    await loadPeriods(companyId);
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Cierre de Ejercicio" subtitle="Genera el asiento de cierre: lleva Ingresos y Gastos a cero y traslada el resultado a Resultados Acumulados" fullWidth>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Inicio del Periodo</label>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Fin del Periodo</label>
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <button onClick={requestClose} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 18, fontSize: 18, background: "#f87171" }}>
          {loading ? "PROCESANDO..." : "SOLICITAR CIERRE DE EJERCICIO"}
        </button>
        {message && <p style={{ marginTop: 10, fontSize: 18, color: message.includes("Error") || message.includes("No hay") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {periods.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Periodos</h2>
          {periods.map((p) => (
            <div key={p.id} style={{ padding: 14, borderBottom: "1px solid #1F2937", fontSize: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span>
                {p.period_start} a {p.period_end}
                {p.status === "PENDING_CLOSE" ? (
                  <span style={{ color: "#facc15" }}> - PENDIENTE DE APROBACION</span>
                ) : (
                  <> - Resultado: <span style={theme.numberStyle}>{p.net_result?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - {p.status}</>
                )}
              </span>
              {p.status === "PENDING_CLOSE" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => confirmClose(p)} disabled={loading} style={{ padding: "8px 16px", background: "none", border: "1px solid #4ade80", color: "#4ade80", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                    Confirmar y Registrar
                  </button>
                  <button onClick={() => rejectClose(p)} disabled={loading} style={{ padding: "8px 16px", background: "none", border: "1px solid #f87171", color: "#f87171", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
