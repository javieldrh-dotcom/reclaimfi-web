"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function IslrPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [accountingNetIncome, setAccountingNetIncome] = useState("");
  const [nonDeductibleAdjustments, setNonDeductibleAdjustments] = useState("0");
  const [exemptIncome, setExemptIncome] = useState("0");
  const [taxUnitValue, setTaxUnitValue] = useState("");
  const [advancePayments, setAdvancePayments] = useState("0");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: hist } = await supabase.from("islr_declarations").select("*").eq("company_id", cid).order("fiscal_year", { ascending: false });
        setHistory(hist ?? []);
      }
    }
    load();
  }, []);

  function calculateTarifa2(incomeUT: number) {
    if (incomeUT <= 2000) return { rate: 15, sustraendo: 0 };
    if (incomeUT <= 3000) return { rate: 22, sustraendo: 140 };
    return { rate: 34, sustraendo: 500 };
  }

  function calculate() {
    const netIncome = parseFloat(accountingNetIncome) || 0;
    const adjustments = parseFloat(nonDeductibleAdjustments) || 0;
    const exempt = parseFloat(exemptIncome) || 0;
    const utValue = parseFloat(taxUnitValue) || 1;
    const advances = parseFloat(advancePayments) || 0;

    const taxableIncome = netIncome + adjustments - exempt;
    const taxableIncomeUT = taxableIncome / utValue;
    const { rate, sustraendo } = calculateTarifa2(taxableIncomeUT);
    const taxUT = (taxableIncomeUT * rate) / 100 - sustraendo;
    const islrTax = taxUT * utValue;
    const netPayable = islrTax - advances;

    return { taxableIncome, taxableIncomeUT, rate, sustraendo, islrTax, netPayable };
  }
  async function saveDeclaration() {
    if (!companyId) return;
    const r = calculate();

    const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_name").eq("company_id", companyId);
    const expenseAccount = (accounts ?? []).find((a: any) => a.account_name.toLowerCase().includes("gasto de islr"));
    const advanceAccount = (accounts ?? []).find((a: any) => a.account_name.toLowerCase().includes("anticipo de islr"));
    const payableAccount = (accounts ?? []).find((a: any) => a.account_name.toLowerCase() === "islr por pagar");

    let journalEntryId = null;
    if (expenseAccount && advanceAccount && payableAccount) {
      const advances = parseFloat(advancePayments) || 0;
      const { data: entry } = await supabase.from("journal_entries").insert([{
        company_id: companyId,
        description: "ISLR Ejercicio Fiscal " + fiscalYear,
        entry_date: new Date().toISOString().slice(0, 10),
      }]).select("id").single();

      if (entry) {
        journalEntryId = entry.id;
        const lines = [{ journal_entry_id: entry.id, account_id: expenseAccount.id, debit: r.islrTax, credit: 0 }];
        if (advances > 0) lines.push({ journal_entry_id: entry.id, account_id: advanceAccount.id, debit: 0, credit: advances });
        if (r.netPayable > 0) lines.push({ journal_entry_id: entry.id, account_id: payableAccount.id, debit: 0, credit: r.netPayable });
        await supabase.from("journal_lines").insert(lines);
      }
    }

    const { error } = await supabase.from("islr_declarations").insert([{
      company_id: companyId,
      fiscal_year: parseInt(fiscalYear),
      accounting_net_income: parseFloat(accountingNetIncome) || 0,
      non_deductible_adjustments: parseFloat(nonDeductibleAdjustments) || 0,
      exempt_income: parseFloat(exemptIncome) || 0,
      taxable_net_income: r.taxableIncome,
      tax_unit_value: parseFloat(taxUnitValue) || 0,
      taxable_income_ut: r.taxableIncomeUT,
      islr_tax: r.islrTax,
      advance_payments: parseFloat(advancePayments) || 0,
      net_payable: r.netPayable,
      status: "FILED",
    }]);
    setMessage(error ? "Error: " + error.message : "Declaracion ISLR guardada correctamente.");
    if (!error && companyId) {
      const { data: hist } = await supabase.from("islr_declarations").select("*").eq("company_id", companyId).order("fiscal_year", { ascending: false });
      setHistory(hist ?? []);
    }
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };
  const r = calculate();

  return (
    <VerticalPageLayout vertical="accounting" title="ISLR - Declaracion Definitiva Anual" subtitle="Tarifa 2 (Personas Juridicas) - Art. 52 Ley de ISLR - Nucleo simplificado, no incluye fuente extraterritorial ni regimenes especiales" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} style={inputStyle} placeholder="Ejercicio Fiscal (Año)" />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Utilidad Contable del Ejercicio</label>
        <input type="number" value={accountingNetIncome} onChange={(e) => setAccountingNetIncome(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Ajustes por Partidas No Deducibles</label>
        <input type="number" value={nonDeductibleAdjustments} onChange={(e) => setNonDeductibleAdjustments(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Rentas Exentas/Exoneradas</label>
        <input type="number" value={exemptIncome} onChange={(e) => setExemptIncome(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Valor de la Unidad Tributaria (Bs)</label>
        <input type="number" value={taxUnitValue} onChange={(e) => setTaxUnitValue(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Anticipos (Retenciones + Estimada)</label>
        <input type="number" value={advancePayments} onChange={(e) => setAdvancePayments(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />

        <div style={{ ...theme.cardStyle, marginTop: 20 }}>
          <p style={{ fontSize: 18, color: "#8B93A7" }}>Enriquecimiento Gravable: <span style={theme.numberStyle}>{r.taxableIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> ({r.taxableIncomeUT.toLocaleString(undefined, { maximumFractionDigits: 2 })} U.T.)</p>
          <p style={{ fontSize: 18, color: "#8B93A7", marginTop: 8 }}>Tarifa aplicable: {r.rate}% (Sustraendo: {r.sustraendo} U.T.)</p>
          <div style={{ marginTop: 16, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900 }}>
            <span>ISLR Determinado</span>
            <span style={theme.numberStyle}>{r.islrTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ marginTop: 12, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 900, color: r.netPayable >= 0 ? "#f87171" : "#4ade80" }}>
            <span>{r.netPayable >= 0 ? "Total a Pagar" : "Credito del Ejercicio"}</span>
            <span style={theme.numberStyle}>{Math.abs(r.netPayable).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <button onClick={saveDeclaration} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18, width: "100%" }}>
            GUARDAR DECLARACION
          </button>
          {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Declaraciones Anteriores</h2>
          {history.map((h) => (
            <div key={h.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 20 }}>
              Ejercicio {h.fiscal_year}: <span style={theme.numberStyle}>{h.net_payable?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
