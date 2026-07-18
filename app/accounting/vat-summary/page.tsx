"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function VatSummaryPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [declarations, setDeclarations] = useState<any[]>([]);

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
        const { data: decl } = await supabase.from("vat_declarations").select("*").eq("company_id", cid).order("period_end", { ascending: false });
        setDeclarations(decl ?? []);
      }
    }
    load();
  }, []);

  async function calculateSummary() {
    if (!companyId || !periodStart || !periodEnd) return;
    setLoading(true);

    const { data: sales } = await supabase.from("sales_book_entries").select("taxable_base_general, fiscal_debit, withheld_by_customer").eq("company_id", companyId).gte("entry_date", periodStart).lte("entry_date", periodEnd);
    const { data: purchases } = await supabase.from("purchase_book_entries").select("taxable_base_general, fiscal_credit, withheld_amount").eq("company_id", companyId).gte("entry_date", periodStart).lte("entry_date", periodEnd);

    const totalSales = (sales ?? []).reduce((s: number, r: any) => s + (r.taxable_base_general || 0), 0);
    const totalDebit = (sales ?? []).reduce((s: number, r: any) => s + (r.fiscal_debit || 0), 0);
    const withheldFromUs = (sales ?? []).reduce((s: number, r: any) => s + (r.withheld_by_customer || 0), 0);

    const totalPurchases = (purchases ?? []).reduce((s: number, r: any) => s + (r.taxable_base_general || 0), 0);
    const totalCredit = (purchases ?? []).reduce((s: number, r: any) => s + (r.fiscal_credit || 0), 0);
    const withheldByUs = (purchases ?? []).reduce((s: number, r: any) => s + (r.withheld_amount || 0), 0);

    const vatPayable = totalDebit - totalCredit - withheldFromUs;

    setSummary({ totalSales, totalDebit, totalPurchases, totalCredit, withheldFromUs, withheldByUs, vatPayable });
    setLoading(false);
  }
  async function saveDeclaration() {
    if (!companyId || !summary) return;
    await supabase.from("vat_declarations").insert([{
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_sales: summary.totalSales,
      total_purchases: summary.totalPurchases,
      fiscal_debit: summary.totalDebit,
      fiscal_credit: summary.totalCredit,
      vat_payable: summary.vatPayable,
      status: "FILED",
    }]);
    const { data: decl } = await supabase.from("vat_declarations").select("*").eq("company_id", companyId).order("period_end", { ascending: false });
    setDeclarations(decl ?? []);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };

  return (
    <VerticalPageLayout vertical="accounting" title="Resumen y Declaracion de IVA" subtitle="Consolida el Libro de Ventas y Compras para determinar el IVA a pagar del periodo" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={calculateSummary} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 18 }}>
          {loading ? "CALCULANDO..." : "CALCULAR RESUMEN DEL PERIODO"}
        </button>

        {summary && (
          <div style={{ ...theme.cardStyle, marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Total Ventas (Base)</span><span style={theme.numberStyle}>{summary.totalSales.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Total Debito Fiscal</span><span style={theme.numberStyle}>{summary.totalDebit.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Total Compras (Base)</span><span style={theme.numberStyle}>{summary.totalPurchases.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Total Credito Fiscal</span><span style={theme.numberStyle}>{summary.totalCredit.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Retenciones que nos hicieron</span><span style={theme.numberStyle}>{summary.withheldFromUs.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Retenciones que hicimos</span><span style={theme.numberStyle}>{summary.withheldByUs.toLocaleString()}</span></div>
            <div style={{ marginTop: 16, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 900, color: summary.vatPayable >= 0 ? "#f87171" : "#4ade80" }}>
              <span>{summary.vatPayable >= 0 ? "IVA a Pagar" : "Excedente a Favor"}</span>
              <span style={theme.numberStyle}>{Math.abs(summary.vatPayable).toLocaleString()}</span>
            </div>
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
              {d.period_start} a {d.period_end} - IVA: <span style={theme.numberStyle}>{d.vat_payable?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
