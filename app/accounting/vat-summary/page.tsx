"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function VatSummaryPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [periodMonth, setPeriodMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0"));
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear().toString());
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [consistencyCheck, setConsistencyCheck] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name, tax_id").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        setCompanyRif(companyData?.tax_id ?? "");
        const { data: decl } = await supabase.from("vat_declarations").select("*").eq("company_id", cid).order("period_end", { ascending: false });
        setDeclarations(decl ?? []);
      }
    }
    load();
  }, []);

  async function calculateSummary() {
    if (!companyId) return;
    setLoading(true);

    const periodStart = periodYear + "-" + periodMonth + "-01";
    const lastDay = new Date(parseInt(periodYear), parseInt(periodMonth), 0).getDate();
    const periodEnd = periodYear + "-" + periodMonth + "-" + lastDay.toString().padStart(2, "0");

    const { data: sales } = await supabase.from("sales_book_entries").select("*").eq("company_id", companyId).eq("status", "ACTIVE").eq("is_reversed", false).gte("entry_date", periodStart).lte("entry_date", periodEnd);
    const { data: purchases } = await supabase.from("purchase_book_entries").select("*").eq("company_id", companyId).eq("status", "ACTIVE").eq("is_reversed", false).gte("entry_date", periodStart).lte("entry_date", periodEnd);

    const casilla40 = (sales ?? []).reduce((s: number, r: any) => s + (r.non_taxable_amount || 0), 0);
    const casilla41 = (sales ?? []).filter((r: any) => r.is_export).reduce((s: number, r: any) => s + (r.total_including_vat || 0), 0);
    const casilla46 = (sales ?? []).reduce((s: number, r: any) => s + (r.taxable_base_general || 0), 0);
    const casilla47 = (sales ?? []).reduce((s: number, r: any) => s + (r.fiscal_debit || 0), 0);
    const casilla49 = casilla47;

    const casilla30 = (purchases ?? []).reduce((s: number, r: any) => s + (r.non_taxable_amount || 0), 0);
    const casilla35 = (purchases ?? []).reduce((s: number, r: any) => s + (r.taxable_base_general || 0) + (r.import_taxable_base || 0), 0);
    const casilla36 = (purchases ?? []).reduce((s: number, r: any) => s + (r.fiscal_credit || 0) + (r.import_tax || 0), 0);
    const casilla39 = casilla36;

    const casilla53 = casilla49 - casilla39;
    const casilla66 = (sales ?? []).reduce((s: number, r: any) => s + (r.withheld_by_customer || 0), 0);
    const casilla90 = Math.max(0, casilla53 - casilla66);
    const casilla60 = casilla53 < 0 ? Math.abs(casilla53) : 0;

    setSummary({ casilla40, casilla41, casilla46, casilla47, casilla49, casilla30, casilla35, casilla36, casilla39, casilla53, casilla66, casilla90, casilla60, periodStart, periodEnd });
    setLoading(false);
  }
  async function verifyConsistency() {
    if (!companyId || !summary) return;
    const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_name").eq("company_id", companyId);
    const creditAcc = (accounts ?? []).filter((a: any) => a.account_name.toLowerCase().includes("credito fiscal") && !a.account_name.toLowerCase().includes("retenci"));
    const debitAcc = (accounts ?? []).filter((a: any) => (a.account_name.toLowerCase().includes("debito fiscal") || a.account_name.toLowerCase().includes("iva por pagar")) && !a.account_name.toLowerCase().includes("retenci"));
    const creditIds = creditAcc.map((a: any) => a.id);
    const debitIds = debitAcc.map((a: any) => a.id);
    const { data: creditLines } = await supabase.from("journal_lines").select("debit, credit, journal_entries!inner(status, entry_date)").in("account_id", creditIds).eq("journal_entries.status", "ACTIVE").gte("journal_entries.entry_date", summary.periodStart).lte("journal_entries.entry_date", summary.periodEnd);
    const { data: debitLines } = await supabase.from("journal_lines").select("debit, credit, journal_entries!inner(status, entry_date)").in("account_id", debitIds).eq("journal_entries.status", "ACTIVE").gte("journal_entries.entry_date", summary.periodStart).lte("journal_entries.entry_date", summary.periodEnd);
    const journalCredit = (creditLines ?? []).reduce((s: number, l: any) => s + (l.debit || 0) - (l.credit || 0), 0);
    const journalDebit = (debitLines ?? []).reduce((s: number, l: any) => s + (l.credit || 0) - (l.debit || 0), 0);
    const creditDiff = Math.abs(journalCredit - summary.casilla36);
    const debitDiff = Math.abs(journalDebit - summary.casilla47);
    setConsistencyCheck({
      creditAccountsFound: creditAcc.length,
      debitAccountsFound: debitAcc.length,
      journalCredit, bookCredit: summary.casilla36, creditDiff, creditOk: creditDiff < 0.5,
      journalDebit, bookDebit: summary.casilla47, debitDiff, debitOk: debitDiff < 0.5,
    });
  }

  async function saveDeclaration() {
    if (!companyId || !summary) return;
    await supabase.from("vat_declarations").insert([{
      company_id: companyId,
      period_start: summary.periodStart,
      period_end: summary.periodEnd,
      total_sales: summary.casilla46,
      total_purchases: summary.casilla35,
      fiscal_debit: summary.casilla47,
      fiscal_credit: summary.casilla36,
      vat_payable: summary.casilla90,
      status: "FILED",
    }]);
    const { data: decl } = await supabase.from("vat_declarations").select("*").eq("company_id", companyId).order("period_end", { ascending: false });
    setDeclarations(decl ?? []);
  }

  const row = (casilla: string, label: string, value: number) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #1F2937", fontSize: 16 }}>
      <span><span style={{ color: theme.accent, fontWeight: 700, marginRight: 8 }}>[{casilla}]</span>{label}</span>
      <span style={theme.numberStyle}>{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  );

  const monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  return (
    <VerticalPageLayout vertical="accounting" title="Resumen y Declaracion de IVA" subtitle="Forma IVA 99030 - Casillas oficiales SENIAT" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 15, color: "#8B93A7" }}>{companyName} - RIF: {companyRif}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <select value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} style={theme.inputStyle}>
            {monthNames.map((m) => <option key={m} value={m}>Mes {m}</option>)}
          </select>
          <input type="number" value={periodYear} onChange={(e) => setPeriodYear(e.target.value)} style={theme.inputStyle} placeholder="Año" />
        </div>
        <button onClick={calculateSummary} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 18 }}>
          {loading ? "CALCULANDO..." : "CALCULAR PERIODO"}
        </button>

        {summary && (
          <div style={{ ...theme.cardStyle, marginTop: 24 }}>
            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>DEBITOS FISCALES</h3>
            {row("40", "Ventas Internas no Gravadas", summary.casilla40)}
            {row("41", "Ventas de Exportacion", summary.casilla41)}
            {row("46", "Base Imponible Ventas Gravadas", summary.casilla46)}
            {row("47", "Impuesto (Debito Fiscal)", summary.casilla47)}
            {row("49", "Total Debitos Fiscales", summary.casilla49)}

            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>CREDITOS FISCALES</h3>
            {row("30", "Compras No Gravadas / Sin Derecho a C.F.", summary.casilla30)}
            {row("35", "Base Imponible Compras y Creditos", summary.casilla35)}
            {row("36", "Impuesto (Credito Fiscal)", summary.casilla36)}
            {row("39", "Total Creditos Fiscales", summary.casilla39)}

            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>AUTOLIQUIDACION</h3>
            {row("53", "Total Cuota Tributaria del Periodo", summary.casilla53)}
            {summary.casilla60 > 0 && row("60", "Excedente de Credito Fiscal", summary.casilla60)}
            {row("66", "Retenciones del Periodo", summary.casilla66)}

            <div style={{ marginTop: 16, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900, color: summary.casilla90 > 0 ? "#f87171" : "#4ade80" }}>
              <span>[90] Total a Pagar</span>
              <span style={theme.numberStyle}>{summary.casilla90.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <button onClick={verifyConsistency} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 16, width: "100%", background: "none", border: "1px solid " + theme.accent, color: theme.accent }}>
              VERIFICAR CONSISTENCIA ANTES DE DECLARAR
            </button>

            {consistencyCheck && (
              <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "#0B0E14" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: consistencyCheck.creditOk ? "#4ade80" : "#f87171" }}>
                  {consistencyCheck.creditOk ? "check" : "x"} IVA Credito Fiscal: Libro {consistencyCheck.bookCredit.toFixed(2)} vs Diario {consistencyCheck.journalCredit.toFixed(2)} {!consistencyCheck.creditOk && "(diferencia: " + consistencyCheck.creditDiff.toFixed(2) + ")"}
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: consistencyCheck.debitOk ? "#4ade80" : "#f87171", marginTop: 6 }}>
                  {consistencyCheck.debitOk ? "check" : "x"} IVA Debito Fiscal: Libro {consistencyCheck.bookDebit.toFixed(2)} vs Diario {consistencyCheck.journalDebit.toFixed(2)} {!consistencyCheck.debitOk && "(diferencia: " + consistencyCheck.debitDiff.toFixed(2) + ")"}
                </p>
                {(consistencyCheck.creditAccountsFound === 0 || consistencyCheck.debitAccountsFound === 0) && (
                  <p style={{ fontSize: 13, color: "#FB923C", marginTop: 8 }}>Advertencia: No se encontraron cuentas con nombre "Credito Fiscal" o "Debito Fiscal" / "IVA por Pagar" en tu plan de cuentas. Verifica manualmente.</p>
                )}
              </div>
            )}

            <button onClick={saveDeclaration} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18, width: "100%" }}>
              GUARDAR DECLARACION
            </button>
          </div>
        )}
      </div>

      {declarations.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Declaraciones Guardadas</h2>
          {declarations.map((d) => (
            <div key={d.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 20 }}>
              {d.period_start} a {d.period_end} - [90] Total a Pagar: <span style={theme.numberStyle}>{d.vat_payable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
