"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";
export default function EquityStatementPage() {
  const theme = getVerticalTheme("accounting");
  const [capital, setCapital] = useState<any[]>([]);
  const [reserves, setReserves] = useState<any[]>([]);
  const [retainedEarnings, setRetainedEarnings] = useState<any[]>([]);
  const [netResult, setNetResult] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
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
        .in("account_type", ["EQUITY", "REVENUE", "EXPENSE"]);
      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);
      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id, journal_entries!inner(status)")
        .in("account_id", accountIds)
        .eq("journal_entries.status", "ACTIVE");
      const grouped: Record<string, any> = {};
      let revenue = 0;
      let expense = 0;
      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        if (acc.account_type === "EQUITY") {
          const key = acc.account_code;
          if (!grouped[key]) grouped[key] = { code: acc.account_code, name: acc.account_name, category: acc.statement_category ?? "CAPITAL", amount: 0 };
          grouped[key].amount += (l.credit || 0) - (l.debit || 0);
        }
        if (acc.account_type === "REVENUE") revenue += (l.credit || 0) - (l.debit || 0);
        if (acc.account_type === "EXPENSE") expense += (l.debit || 0) - (l.credit || 0);
      });
      const all = Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code));
      setCapital(all.filter((r: any) => r.category === "CAPITAL"));
      setReserves(all.filter((r: any) => r.category === "RESERVES"));
      setRetainedEarnings(all.filter((r: any) => r.category === "RETAINED_EARNINGS"));
      setNetResult(revenue - expense);
      setLoading(false);
    }
    load();
  }, []);
  const totalCapital = capital.reduce((s, r) => s + r.amount, 0);
  const totalReserves = reserves.reduce((s, r) => s + r.amount, 0);
  const totalRetainedEarnings = retainedEarnings.reduce((s, r) => s + r.amount, 0);
  const totalEquityBefore = totalCapital + totalReserves + totalRetainedEarnings;
  const totalEquityAfter = totalEquityBefore + netResult;
  function downloadPdf() {
    const doc = generateFinancialStatementPdf(
      "ESTADO DE CAMBIOS EN EL PATRIMONIO",
      companyName,
      [
        { title: "Capital Social", items: capital.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalCapital, totalLabel: "Total Capital Social" },
        { title: "Reservas", items: reserves.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalReserves, totalLabel: "Total Reservas" },
        { title: "Resultados Acumulados", items: retainedEarnings.map((r) => ({ code: r.code, name: r.name, amount: r.amount })), total: totalRetainedEarnings, totalLabel: "Total Resultados Acumulados" },
        { title: "Resultado del Ejercicio", items: [{ name: "Resultado Neto del Periodo", amount: netResult }], total: netResult, totalLabel: "Total Resultado del Ejercicio" },
      ],
      "Patrimonio Final",
      totalEquityAfter,
      currency,
      presentationMode
    );
    doc.save("estado-cambios-patrimonio.pdf");
  }
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;
  const rowStyle = { display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 };
  const totalStyle = { display: "flex", justifyContent: "space-between", padding: 8, fontWeight: 700, fontSize: 20, borderTop: "1px solid #1F2937" };
  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Estado de Cambios en el Patrimonio"
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
      <div style={{ maxWidth: 700 }}>
        <h2 style={{ marginTop: 20, fontSize: 24, color: theme.accent, fontWeight: 700 }}>Capital Social</h2>
        {capital.length === 0 && <p style={{ fontSize: 15, color: "#8B93A7", padding: 8 }}>Sin movimientos de capital registrados.</p>}
        {capital.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Capital Social</span><span style={theme.numberStyle}>{totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: theme.accent, fontWeight: 700 }}>Reservas</h2>
        {reserves.length === 0 && <p style={{ fontSize: 15, color: "#8B93A7", padding: 8 }}>Sin reservas registradas.</p>}
        {reserves.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Reservas</span><span style={theme.numberStyle}>{totalReserves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <h2 style={{ marginTop: 24, fontSize: 24, color: theme.accent, fontWeight: 700 }}>Resultados Acumulados</h2>
        {retainedEarnings.length === 0 && <p style={{ fontSize: 15, color: "#8B93A7", padding: 8 }}>Sin resultados acumulados de ejercicios anteriores.</p>}
        {retainedEarnings.map((r) => (
          <div key={r.code} style={rowStyle}>
            <span>{presentationMode ? r.name : r.code + " - " + r.name}</span>
            <span style={theme.numberStyle}>{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div style={totalStyle}><span>Total Resultados Acumulados</span><span style={theme.numberStyle}>{totalRetainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <div style={{ ...totalStyle, marginTop: 8, fontSize: 22, borderTop: "2px solid " + theme.accent }}><span>Subtotal Patrimonio (antes de resultado)</span><span style={theme.numberStyle}>{totalEquityBefore.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: 8, marginTop: 14, fontSize: 22, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>
          <span>(+/-) Resultado del Ejercicio</span>
          <span style={theme.numberStyle}>{netResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div style={{ marginTop: 24, padding: 18, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900, color: "#4ade80" }}>
          <span>Patrimonio Final</span>
          <span style={theme.numberStyle}>{totalEquityAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </VerticalPageLayout>
  );
}
