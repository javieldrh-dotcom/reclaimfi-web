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
        .select("id, account_code, account_name, account_type")
        .eq("company_id", cid)
        .in("account_type", ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);

      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id")
        .in("account_id", accountIds);

      const grouped: Record<string, any> = {};
      let revenue = 0;
      let expense = 0;

      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        if (acc.account_type === "REVENUE") { revenue += (l.credit || 0) - (l.debit || 0); return; }
        if (acc.account_type === "EXPENSE") { expense += (l.debit || 0) - (l.credit || 0); return; }

        const key = acc.account_code;
        if (!grouped[key]) grouped[key] = { code: acc.account_code, name: acc.account_name, type: acc.account_type, amount: 0 };
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

  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.amount, 0);
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
        { title: "Activos", items: assets.map((a) => ({ code: a.code, name: a.name, amount: a.amount })), total: totalAssets, totalLabel: "Total Activos" },
        { title: "Pasivos", items: liabilities.map((a) => ({ code: a.code, name: a.name, amount: a.amount })), total: totalLiabilities, totalLabel: "Total Pasivos" },
        { title: "Patrimonio", items: equityItems, total: totalEquity, totalLabel: "Total Patrimonio" },
      ],
      "Total Pasivo + Patrimonio",
      totalLiabilities + totalEquity,
      currency
    );
    doc.save("estado-situacion-financiera.pdf");
  }

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;
  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Estado de Situacion Financiera"
      fullWidth
      actions={
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      }
    >
      <div style={{ maxWidth: 700 }}>
        <h2 style={{ marginTop: 20, fontSize: 24, color: theme.accent, fontWeight: 700 }}>Activos</h2>
        {assets.map((r) => (
          <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 22 }}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontWeight: 700, fontSize: 22, borderTop: "1px solid #1F2937" }}>
          <span>Total Activos</span>
          <span style={theme.numberStyle}>{totalAssets.toLocaleString()}</span>
        </div>

        <h2 style={{ marginTop: 30, fontSize: 24, color: "#facc15", fontWeight: 700 }}>Pasivos</h2>
        {liabilities.map((r) => (
          <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 22 }}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontWeight: 700, fontSize: 22, borderTop: "1px solid #1F2937" }}>
          <span>Total Pasivos</span>
          <span style={theme.numberStyle}>{totalLiabilities.toLocaleString()}</span>
        </div>

        <h2 style={{ marginTop: 30, fontSize: 24, color: "#4ade80", fontWeight: 700 }}>Patrimonio</h2>
        {equity.map((r) => (
          <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 22 }}>
            <span>{r.code} - {r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 22, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>
          <span>Resultado del Ejercicio (no cerrado)</span>
          <span style={theme.numberStyle}>{netResult.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontWeight: 700, fontSize: 22, borderTop: "1px solid #1F2937" }}>
          <span>Total Patrimonio</span>
          <span style={theme.numberStyle}>{totalEquity.toLocaleString()}</span>
        </div>

        <div style={{ marginTop: 24, padding: 18, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 900 }}>
          <span>Activos = Pasivos + Patrimonio</span>
          <span style={{ ...theme.numberStyle, color: totalAssets === totalLiabilities + totalEquity ? "#4ade80" : "#f87171" }}>
            {totalAssets.toLocaleString()} {totalAssets === (totalLiabilities + totalEquity) ? "= " : "no cuadra "} {(totalLiabilities + totalEquity).toLocaleString()}
          </span>
        </div>
      </div>
    </VerticalPageLayout>
  );
}
