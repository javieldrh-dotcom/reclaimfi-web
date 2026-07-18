"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function PeriodClosePage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [revenueAccounts, setRevenueAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [retainedEarningsId, setRetainedEarningsId] = useState<string | null>(null);
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
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: rev } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "REVENUE");
        const { data: exp } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "EXPENSE");
        const { data: re } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).ilike("account_name", "%Resultados Acumulados%").limit(1).single();
        setRevenueAccounts(rev ?? []);
        setExpenseAccounts(exp ?? []);
        setRetainedEarningsId(re?.id ?? null);
        await loadPeriods(cid);
      }
    }
    load();
  }, []);

  async function closeperiod() {
    setMessage("");
    setLoading(true);

    if (!companyId || !periodStart || !periodEnd) { setMessage("Completa las fechas del periodo."); setLoading(false); return; }
    if (!retainedEarningsId) { setMessage("No se encontro la cuenta de Resultados Acumulados."); setLoading(false); return; }

    const revenueIds = revenueAccounts.map((a) => a.id);
    const expenseIds = expenseAccounts.map((a) => a.id);

    const { data: revLines } = await supabase.from("journal_lines").select("debit, credit, account_id, journal_entries!inner(entry_date, status)").in("account_id", revenueIds).eq("journal_entries.status", "ACTIVE").gte("journal_entries.entry_date", periodStart).lte("journal_entries.entry_date", periodEnd);
    const { data: expLines } = await supabase.from("journal_lines").select("debit, credit, account_id, journal_entries!inner(entry_date, status)").in("account_id", expenseIds).eq("journal_entries.status", "ACTIVE").gte("journal_entries.entry_date", periodStart).lte("journal_entries.entry_date", periodEnd);

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
    const netResult = totalRevenue - totalExpense;

    if (totalRevenue === 0 && totalExpense === 0) {
      setMessage("No hay movimientos de Ingresos/Gastos en este periodo para cerrar.");
      setLoading(false);
      return;
    }

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Asiento de Cierre de Ejercicio " + periodStart + " a " + periodEnd,
      entry_date: periodEnd,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error: " + entryError?.message); setLoading(false); return; }

    const closingLines: any[] = [];

    Object.entries(revenueByAccount).forEach(([accId, amount]) => {
      if (amount !== 0) closingLines.push({ journal_entry_id: entry.id, account_id: accId, debit: amount, credit: 0 });
    });

    Object.entries(expenseByAccount).forEach(([accId, amount]) => {
      if (amount !== 0) closingLines.push({ journal_entry_id: entry.id, account_id: accId, debit: 0, credit: amount });
    });

    if (netResult >= 0) {
      closingLines.push({ journal_entry_id: entry.id, account_id: retainedEarningsId, debit: 0, credit: netResult });
    } else {
      closingLines.push({ journal_entry_id: entry.id, account_id: retainedEarningsId, debit: Math.abs(netResult), credit: 0 });
    }

    const { error: linesError } = await supabase.from("journal_lines").insert(closingLines);
    if (linesError) { setMessage("Error al guardar lineas: " + linesError.message); setLoading(false); return; }

    await supabase.from("fiscal_periods").insert([{
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "CLOSED",
      closing_entry_id: entry.id,
      closed_at: new Date().toISOString(),
      net_result: netResult,
    }]);

    setMessage("Periodo cerrado correctamente. Resultado: " + netResult.toLocaleString());
    setLoading(false);
    await loadPeriods(companyId);
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Cierre de Ejercicio" subtitle="Genera el asiento de cierre: lleva Ingresos y Gastos a cero y traslada el resultado a Resultados Acumulados" fullWidth>
      <div style={{ maxWidth: 600 }}>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Inicio del Periodo</label>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Fin del Periodo</label>
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <button onClick={closeperiod} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 18, fontSize: 18, background: "#f87171" }}>
          {loading ? "CERRANDO..." : "EJECUTAR CIERRE DE EJERCICIO"}
        </button>
        {message && <p style={{ marginTop: 10, fontSize: 18, color: message.includes("Error") || message.includes("No hay") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {periods.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Periodos Cerrados</h2>
          {periods.map((p) => (
            <div key={p.id} style={{ padding: 14, borderBottom: "1px solid #1F2937", fontSize: 20 }}>
              {p.period_start} a {p.period_end} - Resultado: <span style={theme.numberStyle}>{p.net_result?.toLocaleString()}</span> - {p.status}
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
