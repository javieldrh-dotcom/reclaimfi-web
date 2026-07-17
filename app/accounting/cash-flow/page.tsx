"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";

export default function CashFlowPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  const [netIncome, setNetIncome] = useState(0);
  const [depreciation, setDepreciation] = useState(0);
  const [arChange, setArChange] = useState(0);
  const [apChange, setApChange] = useState(0);
  const [fixedAssetPurchases, setFixedAssetPurchases] = useState(0);
  const [financingChange, setFinancingChange] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id;
      if (!cid) { setLoading(false); return; }
      setCompanyId(cid);

      const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");
      setCurrency(companyData?.functional_currency ?? "USD");

      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type, cash_flow_category")
        .eq("company_id", cid);

      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id, journal_entries!inner(status)")
        .in("account_id", accountIds)
        .eq("journal_entries.status", "ACTIVE");

      let revenue = 0, expense = 0, arDelta = 0, apDelta = 0, investingDelta = 0, financingDelta = 0;

      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        const netMove = (l.debit || 0) - (l.credit || 0);

        if (acc.account_type === "REVENUE") revenue += (l.credit || 0) - (l.debit || 0);
        else if (acc.account_type === "EXPENSE") expense += (l.debit || 0) - (l.credit || 0);
        else if (acc.cash_flow_category === "OPERATING" && acc.account_name.toLowerCase().includes("cliente")) arDelta += netMove;
        else if (acc.cash_flow_category === "OPERATING" && acc.account_name.toLowerCase().includes("proveedor")) apDelta += -netMove;
        else if (acc.cash_flow_category === "INVESTING") investingDelta += netMove;
        else if (acc.cash_flow_category === "FINANCING") financingDelta += -netMove;
      });

      const { data: depData } = await supabase.from("depreciation_entries").select("monthly_depreciation, fixed_assets!inner(company_id)").eq("fixed_assets.company_id", cid);
      const totalDep = (depData ?? []).reduce((s: number, d: any) => s + (d.monthly_depreciation || 0), 0);

      setNetIncome(revenue - expense);
      setDepreciation(totalDep);
      setArChange(arDelta);
      setApChange(apDelta);
      setFixedAssetPurchases(investingDelta);
      setFinancingChange(financingDelta);
      setLoading(false);
    }
    load();
  }, []);
  const operatingCashFlow = netIncome + depreciation + arChange + apChange;
  const investingCashFlow = -fixedAssetPurchases;
  const financingCashFlow = financingChange;
  const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;

  function downloadPdf() {
    const doc = generateFinancialStatementPdf(
      "ESTADO DE FLUJO DE EFECTIVO (Metodo Indirecto - NIC 7)",
      companyName,
      [
        {
          title: "Actividades de Operacion",
          items: [
            { name: "Utilidad del Ejercicio", amount: netIncome },
            { name: "+ Depreciacion (partida no monetaria)", amount: depreciation },
            { name: "Variacion en Cuentas por Cobrar", amount: arChange },
            { name: "Variacion en Cuentas por Pagar", amount: apChange },
          ],
          total: operatingCashFlow,
          totalLabel: "Efectivo Neto de Actividades de Operacion",
        },
        {
          title: "Actividades de Inversion",
          items: [
            { name: "Adquisicion de Activos Fijos", amount: -fixedAssetPurchases },
          ],
          total: investingCashFlow,
          totalLabel: "Efectivo Neto de Actividades de Inversion",
        },
        {
          title: "Actividades de Financiamiento",
          items: [
            { name: "Variacion en Patrimonio y Deuda de Largo Plazo", amount: financingCashFlow },
          ],
          total: financingCashFlow,
          totalLabel: "Efectivo Neto de Actividades de Financiamiento",
        },
      ],
      "Variacion Neta de Efectivo",
      netCashChange,
      currency
    );
    doc.save("estado-flujo-efectivo-nic7.pdf");
  }

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Estado de Flujo de Efectivo"
      subtitle="Metodo Indirecto - Conforme a NIC 7 (IAS 7)"
      actions={
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      }
    >
      <div style={{ ...theme.cardStyle, maxWidth: 700 }}>
        <h3 style={{ color: "#4ade80", fontSize: 18, marginBottom: 12 }}>Actividades de Operacion</h3>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>Utilidad del Ejercicio</span><span style={theme.numberStyle}>{netIncome.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>+ Depreciacion</span><span style={theme.numberStyle}>{depreciation.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>Variacion en Cuentas por Cobrar</span><span style={theme.numberStyle}>{arChange.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>Variacion en Cuentas por Pagar</span><span style={theme.numberStyle}>{apChange.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 8, borderTop: "1px solid #1F2937", fontWeight: 700 }}>
          <span>Efectivo Neto de Operacion</span><span style={theme.numberStyle}>{operatingCashFlow.toLocaleString()}</span>
        </div>

        <h3 style={{ color: "#facc15", fontSize: 18, marginTop: 24, marginBottom: 12 }}>Actividades de Inversion</h3>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>Adquisicion de Activos Fijos</span><span style={theme.numberStyle}>{(-fixedAssetPurchases).toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 8, borderTop: "1px solid #1F2937", fontWeight: 700 }}>
          <span>Efectivo Neto de Inversion</span><span style={theme.numberStyle}>{investingCashFlow.toLocaleString()}</span>
        </div>

        <h3 style={{ color: "#818CF8", fontSize: 18, marginTop: 24, marginBottom: 12 }}>Actividades de Financiamiento</h3>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>Variacion en Patrimonio y Deuda</span><span style={theme.numberStyle}>{financingCashFlow.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 8, borderTop: "1px solid #1F2937", fontWeight: 700 }}>
          <span>Efectivo Neto de Financiamiento</span><span style={theme.numberStyle}>{financingCashFlow.toLocaleString()}</span>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: netCashChange >= 0 ? "#4ade80" : "#f87171" }}>
          <span>Variacion Neta de Efectivo</span>
          <span style={theme.numberStyle}>{netCashChange.toLocaleString()}</span>
        </div>
      </div>
    </VerticalPageLayout>
  );
}
