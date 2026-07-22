"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function IslrEstimatedPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [priorYearNetIncome, setPriorYearNetIncome] = useState("");
  const [taxUnitValue, setTaxUnitValue] = useState("");
  const [installments, setInstallments] = useState("6");
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
        const { data: hist } = await supabase.from("islr_estimated_declarations").select("*").eq("company_id", cid).order("fiscal_year", { ascending: false });
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
    const priorIncome = parseFloat(priorYearNetIncome) || 0;
    const utValue = parseFloat(taxUnitValue) || 1;
    const numInstallments = parseInt(installments) || 6;

    const taxableBase = priorIncome * 0.80;
    const taxableBaseUT = taxableBase / utValue;
    const { rate, sustraendo } = calculateTarifa2(taxableBaseUT);
    const taxUT = (taxableBaseUT * rate) / 100 - sustraendo;
    const islrTax = taxUT * utValue;
    const amountToRemit = islrTax * 0.75;
    const installmentAmount = amountToRemit / numInstallments;

    return { taxableBase, taxableBaseUT, rate, sustraendo, islrTax, amountToRemit, installmentAmount, numInstallments };
  }
  async function saveDeclaration() {
    if (!companyId) return;
    const r = calculate();
    const { error } = await supabase.from("islr_estimated_declarations").insert([{
      company_id: companyId,
      fiscal_year: parseInt(fiscalYear),
      prior_year_net_income: parseFloat(priorYearNetIncome) || 0,
      taxable_base: r.taxableBase,
      tax_unit_value: parseFloat(taxUnitValue) || 0,
      taxable_base_ut: r.taxableBaseUT,
      islr_tax: r.islrTax,
      amount_to_remit: r.amountToRemit,
      installments: r.numInstallments,
      installment_amount: r.installmentAmount,
      status: "FILED",
    }]);
    setMessage(error ? "Error: " + error.message : "Declaracion Estimada guardada correctamente.");
    if (!error && companyId) {
      const { data: hist } = await supabase.from("islr_estimated_declarations").select("*").eq("company_id", companyId).order("fiscal_year", { ascending: false });
      setHistory(hist ?? []);
    }
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };
  const r = calculate();

  return (
    <VerticalPageLayout vertical="accounting" title="ISLR - Declaracion Estimada" subtitle="Anticipo de impuestos - Art. 80 Ley de ISLR / Art. 156-164 Reglamento - Obligatoria si el enriquecimiento neto del año anterior supero 1.500 U.T." fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 16, color: "#8B93A7", lineHeight: 1.7, ...theme.cardStyle }}>
          La Declaracion Estimada es un anticipo de ISLR calculado sobre el 80% del enriquecimiento neto del ejercicio
          anterior. Del impuesto resultante, solo se entera el 75%, fraccionado en hasta 6 porciones mensuales.
        </p>

        <input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} style={{ ...inputStyle, marginTop: 16 }} placeholder="Ejercicio Fiscal (Año)" />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Enriquecimiento Neto del Ejercicio Anterior</label>
        <input type="number" value={priorYearNetIncome} onChange={(e) => setPriorYearNetIncome(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Valor de la Unidad Tributaria (Bs)</label>
        <input type="number" value={taxUnitValue} onChange={(e) => setTaxUnitValue(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 14, display: "block" }}>Numero de Porciones</label>
        <input type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} max="6" />

        <div style={{ ...theme.cardStyle, marginTop: 20 }}>
          <p style={{ fontSize: 18, color: "#8B93A7" }}>Base Imponible (80% del año anterior): <span style={theme.numberStyle}>{r.taxableBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> ({r.taxableBaseUT.toLocaleString(undefined, { maximumFractionDigits: 2 })} U.T.)</p>
          <p style={{ fontSize: 18, color: "#8B93A7", marginTop: 8 }}>Tarifa aplicable: {r.rate}% (Sustraendo: {r.sustraendo} U.T.)</p>
          <div style={{ marginTop: 16, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 900 }}>
            <span>Impuesto Determinado (100%)</span>
            <span style={theme.numberStyle}>{r.islrTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ marginTop: 12, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900, color: "#f87171" }}>
            <span>Monto a Enterar (75%)</span>
            <span style={theme.numberStyle}>{r.amountToRemit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ marginTop: 12, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700, color: theme.accent }}>
            <span>Monto por Porcion ({r.numInstallments} porciones)</span>
            <span style={theme.numberStyle}>{r.installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <button onClick={saveDeclaration} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18, width: "100%" }}>
            GUARDAR DECLARACION ESTIMADA
          </button>
          {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Declaraciones Estimadas Anteriores</h2>
          {history.map((h) => (
            <div key={h.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 20 }}>
              Ejercicio {h.fiscal_year}: <span style={theme.numberStyle}>{h.amount_to_remit?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> en {h.installments} porciones
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
