"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";

export default function InventoryBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [periodStart, setPeriodStart] = useState(new Date().getFullYear() + "-01-01");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"balance" | "income" | "cashflow" | "equity">("balance");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("inventory_book_entries").select("*").eq("company_id", cid).order("entry_number", { ascending: false });
    setEntries(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        await loadEntries(cid);
      }
    }
    load();
  }, []);

  function downloadBalancePdf(e: any) {
    const s = e.balance_sheet_snapshot;
    const eq = e.equity_statement_snapshot;
    const equityItems = [
      ...(eq?.capitalItems ?? []),
      ...(eq?.reservesItems ?? []),
      ...(eq?.retainedItems ?? []),
      { name: "Resultado del Ejercicio", amount: eq?.netIncome ?? 0 },
    ].map((a: any) => ({ code: a.code, name: a.name ?? "Resultado del Ejercicio", amount: a.balance ?? a.amount }));
    const doc = generateFinancialStatementPdf(
      "ESTADO DE SITUACION FINANCIERA - Nº" + e.entry_number,
      companyName,
      [
        { title: "Activos Corrientes", items: (s.currentAssets ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalCurrentAssets, totalLabel: "Total Activos Corrientes" },
        { title: "Activos No Corrientes", items: (s.nonCurrentAssets ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalNonCurrentAssets, totalLabel: "Total Activos No Corrientes" },
        { title: "Pasivos Corrientes", items: (s.currentLiabilities ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalCurrentLiabilities, totalLabel: "Total Pasivos Corrientes" },
        { title: "Pasivos No Corrientes", items: (s.nonCurrentLiabilities ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalNonCurrentLiabilities, totalLabel: "Total Pasivos No Corrientes" },
        { title: "Patrimonio", items: equityItems, total: e.total_equity, totalLabel: "Total Patrimonio" },
      ],
      "Total Pasivo + Patrimonio",
      e.total_liabilities + e.total_equity,
      "USD"
    );
    doc.save("balance-situacion-nº" + e.entry_number + ".pdf");
  }

  function downloadIncomePdf(e: any) {
    const s = e.income_statement_snapshot;
    const doc = generateFinancialStatementPdf(
      "ESTADO DE RESULTADOS - Nº" + e.entry_number,
      companyName,
      [
        { title: "Ingresos", items: (s.revenueItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalRevenue, totalLabel: "Total Ingresos" },
        { title: "Costo de Ventas", items: (s.cogsItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalCogs, totalLabel: "Total Costo de Ventas" },
        { title: "Utilidad Bruta", items: [], total: s.grossProfit, totalLabel: "Utilidad Bruta" },
        { title: "Gastos Operativos", items: (s.operatingItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalOperating, totalLabel: "Total Gastos Operativos" },
        { title: "Utilidad Operativa", items: [], total: s.operatingProfit, totalLabel: "Utilidad Operativa" },
        { title: "Gastos Financieros", items: (s.financialItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalFinancial, totalLabel: "Total Gastos Financieros" },
      ],
      s.netIncome >= 0 ? "Utilidad Neta" : "Perdida Neta",
      s.netIncome,
      "USD"
    );
    doc.save("estado-resultados-nº" + e.entry_number + ".pdf");
  }

  function downloadCashFlowPdf(e: any) {
    const s = e.cash_flow_snapshot;
    const doc = generateFinancialStatementPdf(
      "ESTADO DE FLUJO DE EFECTIVO - Nº" + e.entry_number,
      companyName,
      [
        { title: "Actividades de Operacion", items: [{ name: "Efectivo Neto de Operacion", amount: s.operatingCF }], total: s.operatingCF, totalLabel: "Total Operacion" },
        { title: "Actividades de Inversion", items: [{ name: "Efectivo Neto de Inversion", amount: s.investingCF }], total: s.investingCF, totalLabel: "Total Inversion" },
        { title: "Actividades de Financiamiento", items: [{ name: "Efectivo Neto de Financiamiento", amount: s.financingCF }], total: s.financingCF, totalLabel: "Total Financiamiento" },
      ],
      "Variacion Neta de Efectivo",
      s.netChange,
      "USD"
    );
    doc.save("flujo-efectivo-nº" + e.entry_number + ".pdf");
  }

  function downloadEquityPdf(e: any) {
    const s = e.equity_statement_snapshot;
    const doc = generateFinancialStatementPdf(
      "ESTADO DE CAMBIOS EN EL PATRIMONIO - Nº" + e.entry_number,
      companyName,
      [
        { title: "Capital Social", items: (s.capitalItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalCapital, totalLabel: "Total Capital Social" },
        { title: "Reservas", items: (s.reservesItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalReserves, totalLabel: "Total Reservas" },
        { title: "Resultados Acumulados", items: (s.retainedItems ?? []).map((a: any) => ({ code: a.code, name: a.name, amount: a.balance })), total: s.totalRetained, totalLabel: "Total Resultados Acumulados" },
        { title: "Resultado del Ejercicio", items: [{ name: "Resultado Neto del Periodo", amount: s.netIncome }], total: s.netIncome, totalLabel: "Total Resultado del Ejercicio" },
      ],
      "Patrimonio Final",
      s.totalEquity,
      "USD"
    );
    doc.save("cambios-patrimonio-nº" + e.entry_number + ".pdf");
  }

  async function archivePeriod() {
    setMessage("");
    if (!companyId) return;
    setLoading(true);

    const { data: accountsData } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type, is_current, statement_category, cash_flow_category")
      .eq("company_id", companyId)
      .in("account_type", ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
    const accountsMap: Record<string, any> = {};
    (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
    const accountIds = (accountsData ?? []).map((a: any) => a.id);

    const { data: lines } = await supabase.from("journal_lines").select("debit, credit, account_id").in("account_id", accountIds);
    const balances: Record<string, number> = {};
    (lines ?? []).forEach((l: any) => {
      const acc = accountsMap[l.account_id];
      if (!acc) return;
      const netMovement = (l.debit || 0) - (l.credit || 0);
      balances[l.account_id] = (balances[l.account_id] || 0) + netMovement;
    });
    function bal(accId: string, invert: boolean) {
      const raw = balances[accId] || 0;
      return invert ? -raw : raw;
    }

    const { data: periodEntries } = await supabase.from("journal_entries").select("id").eq("company_id", companyId).gte("entry_date", periodStart).lte("entry_date", periodEnd);
    const periodEntryIds = (periodEntries ?? []).map((e: any) => e.id);
    const periodLinesResult = periodEntryIds.length > 0
      ? await supabase.from("journal_lines").select("debit, credit, account_id").in("account_id", accountIds).in("journal_entry_id", periodEntryIds)
      : { data: [] };
    const periodLines = periodLinesResult.data;
    const periodBalances: Record<string, number> = {};
    (periodLines ?? []).forEach((l: any) => {
      const acc = accountsMap[l.account_id];
      if (!acc) return;
      const netMovement = (l.debit || 0) - (l.credit || 0);
      periodBalances[l.account_id] = (periodBalances[l.account_id] || 0) + netMovement;
    });
    function periodBal(accId: string, invert: boolean) {
      const raw = periodBalances[accId] || 0;
      return invert ? -raw : raw;
    }

    const assetEntries = Object.keys(balances).filter((id) => accountsMap[id]?.account_type === "ASSET");
    const liabilityEntries = Object.keys(balances).filter((id) => accountsMap[id]?.account_type === "LIABILITY");
    const equityEntries = Object.keys(balances).filter((id) => accountsMap[id]?.account_type === "EQUITY");
    const revenueEntries = Object.keys(balances).filter((id) => accountsMap[id]?.account_type === "REVENUE");
    const expenseEntries = Object.keys(balances).filter((id) => accountsMap[id]?.account_type === "EXPENSE");

    const currentAssets = assetEntries.filter((id) => accountsMap[id].is_current !== false).map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, false) }));
    const nonCurrentAssets = assetEntries.filter((id) => accountsMap[id].is_current === false).map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, false) }));
    const currentLiabilities = liabilityEntries.filter((id) => accountsMap[id].is_current !== false).map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, true) }));
    const nonCurrentLiabilities = liabilityEntries.filter((id) => accountsMap[id].is_current === false).map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, true) }));

    const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.balance, 0);
    const totalNonCurrentAssets = nonCurrentAssets.reduce((s, a) => s + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
    const totalCurrentLiabilities = currentLiabilities.reduce((s, a) => s + a.balance, 0);
    const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    const revenueItems = revenueEntries.map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: periodBal(id, true) }));
    const cogsItems = expenseEntries.filter((id) => accountsMap[id].statement_category === "COGS").map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: periodBal(id, false) }));
    const operatingItems = expenseEntries.filter((id) => accountsMap[id].statement_category === "OPERATING").map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: periodBal(id, false) }));
    const financialItems = expenseEntries.filter((id) => accountsMap[id].statement_category === "FINANCIAL").map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: periodBal(id, false) }));

    const totalRevenue = revenueItems.reduce((s, a) => s + a.balance, 0);
    const totalCogs = cogsItems.reduce((s, a) => s + a.balance, 0);
    const grossProfit = totalRevenue - totalCogs;
    const totalOperating = operatingItems.reduce((s, a) => s + a.balance, 0);
    const operatingProfit = grossProfit - totalOperating;
    const totalFinancial = financialItems.reduce((s, a) => s + a.balance, 0);
    const netIncome = operatingProfit - totalFinancial;

    const capitalItems = equityEntries.filter((id) => accountsMap[id].statement_category === "CAPITAL").map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, true) }));
    const reservesItems = equityEntries.filter((id) => accountsMap[id].statement_category === "RESERVES").map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, true) }));
    const retainedItems = equityEntries.filter((id) => accountsMap[id].statement_category === "RETAINED_EARNINGS").map((id) => ({ code: accountsMap[id].account_code, name: accountsMap[id].account_name, balance: bal(id, true) }));
    const totalCapital = capitalItems.reduce((s, a) => s + a.balance, 0);
    const totalReserves = reservesItems.reduce((s, a) => s + a.balance, 0);
    const totalRetained = retainedItems.reduce((s, a) => s + a.balance, 0);
    const totalEquity = totalCapital + totalReserves + totalRetained + netIncome;

    const operatingCF = accountIds.filter((id) => accountsMap[id].cash_flow_category === "OPERATING").reduce((s, id) => s + (balances[id] || 0), 0);
    const investingCF = accountIds.filter((id) => accountsMap[id].cash_flow_category === "INVESTING").reduce((s, id) => s + (balances[id] || 0), 0);
    const financingCF = accountIds.filter((id) => accountsMap[id].cash_flow_category === "FINANCING").reduce((s, id) => s + (balances[id] || 0), 0);

    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { error } = await supabase.from("inventory_book_entries").insert([{
      company_id: companyId,
      entry_number: nextNumber,
      period_end: periodEnd,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      balance_sheet_snapshot: { currentAssets, nonCurrentAssets, currentLiabilities, nonCurrentLiabilities, totalCurrentAssets, totalNonCurrentAssets, totalCurrentLiabilities, totalNonCurrentLiabilities },
      income_statement_snapshot: { revenueItems, cogsItems, operatingItems, financialItems, totalRevenue, totalCogs, grossProfit, totalOperating, operatingProfit, totalFinancial, netIncome },
      cash_flow_snapshot: { operatingCF, investingCF, financingCF, netChange: operatingCF + investingCF + financingCF },
      equity_statement_snapshot: { capitalItems, reservesItems, retainedItems, totalCapital, totalReserves, totalRetained, netIncome, totalEquity },
    }]);

    if (error) { setMessage("Error: " + error.message); setLoading(false); return; }

    setMessage("Ejercicio archivado correctamente con los 4 Estados Financieros en estructura NIIF (Nº " + nextNumber + ").");
    setLoading(false);
    await loadEntries(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };
  const tabStyle = (tab: string) => ({
    padding: "8px 16px", cursor: "pointer", fontSize: 15, fontWeight: 700, borderRadius: 8,
    background: activeTab === tab ? theme.accent : "transparent",
    color: activeTab === tab ? "#0B0E14" : "#8B93A7",
    border: activeTab === tab ? "none" : "1px solid #1F2937",
  });
  const rowStyle = { display: "flex", justifyContent: "space-between", padding: 5, fontSize: 14, borderBottom: "1px solid #1F2937" };
  const totalRowStyle = { display: "flex", justifyContent: "space-between", padding: 8, marginTop: 8, borderTop: "1px solid #1F2937", fontWeight: 700, fontSize: 15 };
  const subtotalRowStyle = { display: "flex", justifyContent: "space-between", padding: 10, marginTop: 8, background: "#0B0E14", borderRadius: 8, fontWeight: 900, fontSize: 16 };

  const entriesByYear: Record<string, any[]> = {};
  entries.forEach((e) => {
    const year = e.period_end.slice(0, 4);
    if (!entriesByYear[year]) entriesByYear[year] = [];
    entriesByYear[year].push(e);
  });

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Inventario" subtitle="Registro legal obligatorio - Archiva el conjunto vinculado de Estados Financieros en estructura NIIF al cierre de cada ejercicio (Codigo de Comercio)" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 16, color: "#8B93A7", lineHeight: 1.7, ...theme.cardStyle }}>
          Este libro archiva de forma secuencial e inalterable el conjunto vinculado de Estados Financieros
          resultantes de las operaciones del ejercicio, con la misma estructura NIIF de las paginas individuales
          (Corriente/No Corriente, Utilidad Bruta/Operativa, Capital/Reservas/Resultados Acumulados). Una vez
          archivado, un registro no puede modificarse ni eliminarse.
        </p>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16, display: "block" }}>Fecha de Inicio del Periodo</label>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16, display: "block" }}>Fecha de Cierre del Ejercicio</label>
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <button onClick={archivePeriod} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          {loading ? "ARCHIVANDO..." : "ARCHIVAR ESTADOS FINANCIEROS DEL EJERCICIO"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {Object.keys(entriesByYear).sort((a, b) => b.localeCompare(a)).map((year) => (
        <div key={year} style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 28, color: theme.accent, fontWeight: 900 }}>{companyName} - Ejercicio Fiscal {year}</h2>
          {entriesByYear[year].map((e) => (
            <div key={e.id} style={{ ...theme.cardStyle, marginTop: 16 }}>
              <div onClick={() => setExpandedEntry(expandedEntry === e.id ? null : e.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>Nº {e.entry_number} - Cierre al {e.period_end}</span>
                <span style={{ fontSize: 16, color: theme.accent }}>{expandedEntry === e.id ? "▲ Ocultar" : "▼ Ver Estados Financieros"}</span>
              </div>

              {expandedEntry === e.id && (
                <div style={{ marginTop: 16, borderTop: "1px solid #1F2937", paddingTop: 16 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <div onClick={() => setActiveTab("balance")} style={tabStyle("balance")}>Balance de Situacion</div>
                    <div onClick={() => setActiveTab("income")} style={tabStyle("income")}>Estado de Resultados</div>
                    <div onClick={() => setActiveTab("cashflow")} style={tabStyle("cashflow")}>Flujo de Efectivo</div>
                    <div onClick={() => setActiveTab("equity")} style={tabStyle("equity")}>Cambios en el Patrimonio</div>
                    <button onClick={() => {
                      if (activeTab === "balance") downloadBalancePdf(e);
                      if (activeTab === "income") downloadIncomePdf(e);
                      if (activeTab === "cashflow") downloadCashFlowPdf(e);
                      if (activeTab === "equity") downloadEquityPdf(e);
                    }} style={{ marginLeft: "auto", background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                      Descargar PDF
                    </button>
                  </div>

                  {activeTab === "balance" && e.balance_sheet_snapshot && (
                    <div>
                      <h4 style={{ fontSize: 15, color: theme.accent, fontWeight: 700 }}>Activos Corrientes</h4>
                      {(e.balance_sheet_snapshot.currentAssets ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Activos Corrientes</span><span style={theme.numberStyle}>{e.balance_sheet_snapshot.totalCurrentAssets?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginTop: 14 }}>Activos No Corrientes</h4>
                      {(e.balance_sheet_snapshot.nonCurrentAssets ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Activos No Corrientes</span><span style={theme.numberStyle}>{e.balance_sheet_snapshot.totalNonCurrentAssets?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={{ ...totalRowStyle, marginTop: 6, fontSize: 16, borderTop: "2px solid " + theme.accent }}><span>TOTAL ACTIVOS</span><span style={theme.numberStyle}>{e.total_assets?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: "#facc15", fontWeight: 700, marginTop: 14 }}>Pasivos Corrientes</h4>
                      {(e.balance_sheet_snapshot.currentLiabilities ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Pasivos Corrientes</span><span style={theme.numberStyle}>{e.balance_sheet_snapshot.totalCurrentLiabilities?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: "#facc15", fontWeight: 700, marginTop: 14 }}>Pasivos No Corrientes</h4>
                      {(e.balance_sheet_snapshot.nonCurrentLiabilities ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Pasivos No Corrientes</span><span style={theme.numberStyle}>{e.balance_sheet_snapshot.totalNonCurrentLiabilities?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={{ ...totalRowStyle, marginTop: 6, fontSize: 16, borderTop: "2px solid #facc15" }}><span>TOTAL PASIVOS</span><span style={theme.numberStyle}>{e.total_liabilities?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginTop: 14 }}>Patrimonio</h4>
                      {(e.equity_statement_snapshot?.capitalItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      {(e.equity_statement_snapshot?.reservesItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      {(e.equity_statement_snapshot?.retainedItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={rowStyle}><span>Resultado del Ejercicio</span><span style={theme.numberStyle}>{e.equity_statement_snapshot?.netIncome?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={subtotalRowStyle}><span>Total Patrimonio</span><span style={theme.numberStyle}>{e.total_equity?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                    </div>
                  )}

                  {activeTab === "income" && e.income_statement_snapshot && (
                    <div>
                      <h4 style={{ fontSize: 15, color: "#4ade80", fontWeight: 700 }}>Ingresos</h4>
                      {(e.income_statement_snapshot.revenueItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Ingresos</span><span style={theme.numberStyle}>{e.income_statement_snapshot.totalRevenue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: "#f87171", fontWeight: 700, marginTop: 14 }}>Costo de Ventas</h4>
                      {(e.income_statement_snapshot.cogsItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={subtotalRowStyle}><span>Utilidad Bruta</span><span style={theme.numberStyle}>{e.income_statement_snapshot.grossProfit?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: "#f87171", fontWeight: 700, marginTop: 14 }}>Gastos Operativos</h4>
                      {(e.income_statement_snapshot.operatingItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={subtotalRowStyle}><span>Utilidad Operativa</span><span style={theme.numberStyle}>{e.income_statement_snapshot.operatingProfit?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: "#f87171", fontWeight: 700, marginTop: 14 }}>Gastos Financieros</h4>
                      {(e.income_statement_snapshot.financialItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={{ ...subtotalRowStyle, color: e.income_statement_snapshot.netIncome >= 0 ? "#4ade80" : "#f87171" }}><span>Resultado Neto del Periodo</span><span style={theme.numberStyle}>{e.income_statement_snapshot.netIncome?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                    </div>
                  )}

                  {activeTab === "cashflow" && e.cash_flow_snapshot && (
                    <div>
                      <div style={rowStyle}><span>Efectivo Neto de Operacion</span><span style={theme.numberStyle}>{e.cash_flow_snapshot.operatingCF?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={rowStyle}><span>Efectivo Neto de Inversion</span><span style={theme.numberStyle}>{e.cash_flow_snapshot.investingCF?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={rowStyle}><span>Efectivo Neto de Financiamiento</span><span style={theme.numberStyle}>{e.cash_flow_snapshot.financingCF?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={subtotalRowStyle}><span>Variacion Neta de Efectivo</span><span style={theme.numberStyle}>{e.cash_flow_snapshot.netChange?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                    </div>
                  )}

                  {activeTab === "equity" && e.equity_statement_snapshot && (
                    <div>
                      <h4 style={{ fontSize: 15, color: theme.accent, fontWeight: 700 }}>Capital Social</h4>
                      {(e.equity_statement_snapshot.capitalItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Capital Social</span><span style={theme.numberStyle}>{e.equity_statement_snapshot.totalCapital?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginTop: 14 }}>Reservas</h4>
                      {(e.equity_statement_snapshot.reservesItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Reservas</span><span style={theme.numberStyle}>{e.equity_statement_snapshot.totalReserves?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <h4 style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginTop: 14 }}>Resultados Acumulados</h4>
                      {(e.equity_statement_snapshot.retainedItems ?? []).map((a: any, i: number) => <div key={i} style={rowStyle}><span>{a.code} - {a.name}</span><span style={theme.numberStyle}>{a.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                      <div style={totalRowStyle}><span>Total Resultados Acumulados</span><span style={theme.numberStyle}>{e.equity_statement_snapshot.totalRetained?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>

                      <div style={{ ...rowStyle, marginTop: 14, color: e.equity_statement_snapshot.netIncome >= 0 ? "#4ade80" : "#f87171" }}><span>(+/-) Resultado del Ejercicio</span><span style={theme.numberStyle}>{e.equity_statement_snapshot.netIncome?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                      <div style={subtotalRowStyle}><span>Patrimonio Final</span><span style={theme.numberStyle}>{e.equity_statement_snapshot.totalEquity?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </VerticalPageLayout>
  );
}
