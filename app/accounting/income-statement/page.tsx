"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";
export default function IncomeStatementPage() {
  const theme = getVerticalTheme("accounting");
  const [revenue, setRevenue] = useState<any[]>([]);
  const [cogs, setCogs] = useState<any[]>([]);
  const [operatingExpenses, setOperatingExpenses] = useState<any[]>([]);
  const [financialExpenses, setFinancialExpenses] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id;
      if (!cid) { setLoading(false); return; }
      const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");
      setCurrency(companyData?.functional_currency ?? "USD");
      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type, statement_category")
        .eq("company_id", cid)
        .in("account_type", ["REVENUE", "EXPENSE"]);
      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);
      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id")
        .in("account_id", accountIds);
      const grouped: Record<string, any> = {};
      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        const key = acc.account_code;
        if (!grouped[key]) grouped[key] = { code: acc.account_code, name: acc.account_name, type: acc.account_type, category: acc.statement_category ?? "OPERATING", amount: 0 };
        if (acc.account_type === "REVENUE") grouped[key].amount += (l.credit || 0) - (l.debit || 0);
        if (acc.account_type === "EXPENSE") grouped[key].amount += (l.debit || 0) - (l.credit || 0);
      });
      const all = Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code));
      setRevenue(all.filter((r: any) => r.type === "REVENUE"));
      setCogs(all.filter((r: any) => r.type === "EXPENSE" && r.category === "COGS"));
      setOperatingExpenses(all.filter((r: any) => r.type === "EXPENSE" && r.category === "OPERATING"));
      setFinancialExpenses(all.filter((r: any) => r.type === "EXPENSE" && r.category === "FINANCIAL"));
      setLoading(false);
    }
    load();
  }, []);
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalCogs = cogs.reduce((s, r) => s + r.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalOperatingExpenses = operatingExpenses.reduce((s, r) => s + r.amount, 0);
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const totalFinancialExpenses = financialExpenses.reduce((s, r) => s + r.amount, 0);
  const netResult = operatingProfit - totalFinancialExpenses;

  function downloadPdf() {
    const doc = generateFinancialStatementPdf(
      "ESTADO DE RESULTADOS",
      companyName,
      [
        { title: "Ingresos", items: revenue.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalRevenue, totalLabel: "Total Ingresos" },
        { title: "Costo de Ventas", items: cogs.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalCogs, totalLabel: "Total Costo de Ventas" },
        { title: "Utilidad Bruta", items: [], total: grossProfit, totalLabel: "Utilidad Bruta" },
        { title: "Gastos Operativos", items: operatingExpenses.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalOperatingExpenses, totalLabel: "Total Gastos Operativos" },
        { title: "Utilidad Operativa", items: [], total: operatingProfit, totalLabel: "Utilidad Operativa" },
        { title: "Gastos Financieros", items: financialExpenses.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalFinancialExpenses, totalLabel: "Total Gastos Financieros" },
      ],
      netResult >= 0 ? "Utilidad Neta" : "Perdida Neta",
      netResult,
      currency
    );
    doc.save("estado-de-resultados.pdf");
  }
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  const rowStyle = { display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 };
  const totalStyle = { display: "flex", justifyContent: "space-between", padding: 8, fontWeight: 700, fontSize: 20, borderTop: "1px solid #1F2937" };
  const subtotalStyle = { display: "flex", justifyContent: "space-between", padding: 10, marginTop: 8, background: "#0B0E14", borderRadius: 10, fontSize: 22, fontWeight: 900 };

  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Estado de Resultados"
      fullWidth
      actions={
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      }
    >
      <div style={{ maxWidth: 700 }}>
        <h2 style={{ marginTop: 20, fontSize: 24, color: "#4ade80", fontWeight: 700 }}>Ingresos</h2>
        {revenue.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Ingresos</span><span style={theme.numberStyle}>{totalRevenue.toLocaleString()}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: "#f87171", fontWeight: 700 }}>Costo de Ventas</h2>
        {cogs.length === 0 && <p style={{ fontSize: 15, color: "#8B93A7", padding: 8 }}>Sin costo de ventas registrado.</p>}
        {cogs.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Costo de Ventas</span><span style={theme.numberStyle}>{totalCogs.toLocaleString()}</span></div>

        <div style={subtotalStyle}><span>Utilidad Bruta</span><span style={theme.numberStyle}>{grossProfit.toLocaleString()}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: "#f87171", fontWeight: 700 }}>Gastos Operativos</h2>
        {operatingExpenses.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Gastos Operativos</span><span style={theme.numberStyle}>{totalOperatingExpenses.toLocaleString()}</span></div>

        <div style={subtotalStyle}><span>Utilidad Operativa</span><span style={theme.numberStyle}>{operatingProfit.toLocaleString()}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: "#f87171", fontWeight: 700 }}>Gastos Financieros</h2>
        {financialExpenses.length === 0 && <p style={{ fontSize: 15, color: "#8B93A7", padding: 8 }}>Sin gastos financieros registrados.</p>}
        {financialExpenses.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Gastos Financieros</span><span style={theme.numberStyle}>{totalFinancialExpenses.toLocaleString()}</span></div>

        <div style={{ marginTop: 24, padding: 18, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>
          <span>{netResult >= 0 ? "Utilidad Neta" : "Perdida Neta"}</span>
          <span style={theme.numberStyle}>{Math.abs(netResult).toLocaleString()}</span>
        </div>
      </div>
    </VerticalPageLayout>
  );
}