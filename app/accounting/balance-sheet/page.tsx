"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";
export default function BalanceSheetPage() {
  const theme = getVerticalTheme("accounting");
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [equity, setEquity] = useState<any[]>([]);
  const [netResult, setNetResult] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id;
      if (!cid) { setLoading(false); return; }
      const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");
      setCurrency(companyData?.functional_currency ?? "USD");
      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type, is_current")
        .eq("company_id", cid)
        .in("account_type", ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id, journal_entries!inner(status)")
        .eq("journal_entries.status", "ACTIVE");
      const grouped: Record<string, any> = {};
      let revenue = 0;
      let expense = 0;
      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        if (acc.account_type === "REVENUE") { revenue += (l.credit || 0) - (l.debit || 0); return; }
        if (acc.account_type === "EXPENSE") { expense += (l.debit || 0) - (l.credit || 0); return; }
        const key = acc.account_code;
        if (!grouped[key]) grouped[key] = { code: acc.account_code, name: acc.account_name, type: acc.account_type, isCurrent: acc.is_current ?? true, amount: 0 };
        if (acc.account_type === "ASSET") grouped[key].amount += (l.debit || 0) - (l.credit || 0);
        else grouped[key].amount += (l.credit || 0) - (l.debit || 0);
      });
      const all = Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code));
      setAssets(all.filter((r: any) => r.type === "ASSET"));
      setLiabilities(all.filter((r: any) => r.type === "LIABILITY"));
      setEquity(all.filter((r: any) => r.type === "EQUITY"));
      setNetResult(revenue - expense);
      setLoading(false);
    }
    load();
  }, []);
  const currentAssets = assets.filter((r) => r.isCurrent);
  const nonCurrentAssets = assets.filter((r) => !r.isCurrent);
  const currentLiabilities = liabilities.filter((r) => r.isCurrent);
  const nonCurrentLiabilities = liabilities.filter((r) => !r.isCurrent);
  const totalCurrentAssets = currentAssets.reduce((s, r) => s + r.amount, 0);
  const totalNonCurrentAssets = nonCurrentAssets.reduce((s, r) => s + r.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiabilities = currentLiabilities.reduce((s, r) => s + r.amount, 0);
  const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
  const totalEquityAccounts = equity.reduce((s, r) => s + r.amount, 0);
  const totalEquity = totalEquityAccounts + netResult;
  function downloadPdf() {
    const equityItems = [
      ...equity.map((a) => ({ code: a.code, name: a.name, amount: a.amount })),
      { name: "Resultado del Ejercicio (no cerrado)", amount: netResult },
    ];
    const doc = generateFinancialStatementPdf(
      "ESTADO DE SITUACION FINANCIERA",
      companyName,
      [
        { title: "Activos Corrientes", items: currentAssets.map((a) => ({ code: a.code, name: a.name, amount: a.amount })), total: totalCurrentAssets, totalLabel: "Total Activos Corrientes" },
        { title: "Activos No Corrientes", items: nonCurrentAssets.map((a) => ({ code: a.code, name: a.name, amount: a.amount })), total: totalNonCurrentAssets, totalLabel: "Total Activos No Corrientes" },
        { title: "Pasivos Corrientes", items: currentLiabilities.map((a) => ({ code: a.code, name: a.name, amount: a.amount })), total: totalCurrentLiabilities, totalLabel: "Total Pasivos Corrientes" },
        { title: "Pasivos No Corrientes", items: nonCurrentLiabilities.map((a) => ({ code: a.code, name: a.name, amount: a.amount })), total: totalNonCurrentLiabilities, totalLabel: "Total Pasivos No Corrientes" },
        { title: "Patrimonio", items: equityItems, total: totalEquity, totalLabel: "Total Patrimonio" },
      ],
      "Total Pasivo + Patrimonio",
      totalLiabilities + totalEquity,
      currency,
        presentationMode
    );
    doc.save("estado-situacion-financiera.pdf");
  }
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  const rowStyle = { display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 };
  const totalStyle = { display: "flex", justifyContent: "space-between", padding: 8, fontWeight: 700, fontSize: 20, borderTop: "1px solid #1F2937" };

  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Estado de Situacion Financiera"
      fullWidth
      actions={
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#8B93A7", cursor: "pointer" }}>
            <input type="checkbox" checked={presentationMode} onChange={(e) => setPresentationMode(e.target.checked)} />
            Modo Presentacion (sin codigos)
          </label>
          <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
            Descargar PDF
          </button>
        </div>
      }
    >
      <div>
        <h2 style={{ marginTop: 20, fontSize: 24, color: theme.accent, fontWeight: 700 }}>Activos Corrientes</h2>
        {currentAssets.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Activos Corrientes</span><span style={theme.numberStyle}>{totalCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: theme.accent, fontWeight: 700 }}>Activos No Corrientes</h2>
        {nonCurrentAssets.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Activos No Corrientes</span><span style={theme.numberStyle}>{totalNonCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div style={{ ...totalStyle, marginTop: 8, fontSize: 22, borderTop: "2px solid " + theme.accent }}><span>TOTAL ACTIVOS</span><span style={theme.numberStyle}>{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <h2 style={{ marginTop: 30, fontSize: 24, color: "#facc15", fontWeight: 700 }}>Pasivos Corrientes</h2>
        {currentLiabilities.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Pasivos Corrientes</span><span style={theme.numberStyle}>{totalCurrentLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: "#facc15", fontWeight: 700 }}>Pasivos No Corrientes</h2>
        {nonCurrentLiabilities.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Pasivos No Corrientes</span><span style={theme.numberStyle}>{totalNonCurrentLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div style={{ ...totalStyle, marginTop: 8, fontSize: 22, borderTop: "2px solid #facc15" }}><span>TOTAL PASIVOS</span><span style={theme.numberStyle}>{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <h2 style={{ marginTop: 30, fontSize: 24, color: "#4ade80", fontWeight: 700 }}>Patrimonio</h2>
        {equity.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={{ ...rowStyle, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>
          <span>Resultado del Ejercicio (no cerrado)</span>
          <span style={theme.numberStyle}>{netResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div style={totalStyle}><span>Total Patrimonio</span><span style={theme.numberStyle}>{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <div style={{ marginTop: 24, padding: 18, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900 }}>
          <span>Activos = Pasivos + Patrimonio</span>
          <span style={{ ...theme.numberStyle, color: totalAssets === totalLiabilities + totalEquity ? "#4ade80" : "#f87171" }}>
            {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalAssets === (totalLiabilities + totalEquity) ? "= " : "no cuadra "} {(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </VerticalPageLayout>
  );
}
