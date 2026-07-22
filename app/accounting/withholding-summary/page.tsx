"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function WithholdingSummaryPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [taxAgentRif, setTaxAgentRif] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [salesWithheld, setSalesWithheld] = useState<any[]>([]);
  const [purchaseWithheld, setPurchaseWithheld] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name, tax_id").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        setTaxAgentRif(companyData?.tax_id ?? "");
        const { data: hist } = await supabase.from("withholding_summary").select("*").eq("company_id", cid).order("period_end", { ascending: false });
        setHistory(hist ?? []);
      }
    }
    load();
  }, []);

  async function calculateSummary() {
    if (!companyId || !periodStart || !periodEnd) return;
    setLoading(true);

    const { data: sales } = await supabase.from("sales_book_entries").select("customer_name, entry_date, withheld_by_customer").eq("company_id", companyId).gte("entry_date", periodStart).lte("entry_date", periodEnd).gt("withheld_by_customer", 0);
    const { data: purchases } = await supabase.from("purchase_book_entries").select("vendor_name, entry_date, withheld_amount, withholding_receipt_number").eq("company_id", companyId).gte("entry_date", periodStart).lte("entry_date", periodEnd).gt("withheld_amount", 0);

    const casilla34 = (sales ?? []).reduce((s: number, r: any) => s + (r.withheld_by_customer || 0), 0);
    const casilla66_compras = (purchases ?? []).reduce((s: number, r: any) => s + (r.withheld_amount || 0), 0);
    const casilla37 = casilla34;
    const casilla38 = casilla34;
    const netPosition = casilla66_compras - casilla34;

    setSalesWithheld(sales ?? []);
    setPurchaseWithheld(purchases ?? []);
    setSummary({ casilla34, casilla37, casilla38, totalWithheldByUs: casilla66_compras, netPosition });
    setLoading(false);
  }
  function exportTxt() {
    const rows = purchaseWithheld.map((p: any) => {
      const columns = [
        taxAgentRif,
        periodStart.replace(/-/g, "").slice(0, 6),
        p.entry_date,
        "C",
        "01",
        p.vendor_tax_id,
        p.invoice_number || "",
        p.control_number || "",
        (p.total_document_amount || 0).toFixed(2),
        (p.taxable_base_general || 0).toFixed(2),
        (p.withheld_amount || 0).toFixed(2),
        p.affected_document_number || "0",
        p.withholding_receipt_number || "",
        (p.exempt_amount || 0).toFixed(2),
        "16.00",
        "",
      ];
      return columns.join("\t");
    });
    const txtContent = rows.join("\r\n");
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "retenciones-iva-" + periodStart + "-a-" + periodEnd + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSummary() {
    if (!companyId || !summary) return;
    await supabase.from("withholding_summary").insert([{
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_withheld_from_us: summary.casilla34,
      total_withheld_by_us: summary.totalWithheldByUs,
      net_withholding_position: summary.netPosition,
    }]);
    const { data: hist } = await supabase.from("withholding_summary").select("*").eq("company_id", companyId).order("period_end", { ascending: false });
    setHistory(hist ?? []);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };

  const row = (casilla: string, label: string, value: number) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #1F2937", fontSize: 18 }}>
      <span><span style={{ color: theme.accent, fontWeight: 700, marginRight: 8 }}>[{casilla}]</span>{label}</span>
      <span style={theme.numberStyle}>{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  );

  return (
    <VerticalPageLayout vertical="accounting" title="Resumen de Retenciones" subtitle="Casillas oficiales SENIAT - Consolida retenciones recibidas y efectuadas" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 15, color: "#8B93A7" }}>{companyName} - RIF: {taxAgentRif}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={calculateSummary} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 18 }}>
          {loading ? "CALCULANDO..." : "CALCULAR RETENCIONES DEL PERIODO"}
        </button>

        {summary && (
          <div style={{ ...theme.cardStyle, marginTop: 24 }}>
            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>RETENCIONES QUE NOS HICIERON (Ventas)</h3>
            {row("34", "Retenciones del Periodo", summary.casilla34)}
            {row("37", "Total Retenciones", summary.casilla37)}
            {row("38", "Retenciones Soportadas y Descontadas", summary.casilla38)}

            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>RETENCIONES QUE HICIMOS (Compras)</h3>
            {row("66", "Retenciones Efectuadas a Proveedores", summary.totalWithheldByUs)}

            <div style={{ marginTop: 16, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900, color: summary.netPosition >= 0 ? "#f87171" : "#4ade80" }}>
              <span>{summary.netPosition >= 0 ? "Neto a Enterar al Fisco" : "Neto a Favor"}</span>
              <span style={theme.numberStyle}>{Math.abs(summary.netPosition).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <button onClick={saveSummary} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18, width: "100%" }}>
              GUARDAR RESUMEN
            </button>
          </div>
        )}
      </div>

      {salesWithheld.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Retenciones Recibidas de Clientes</h2>
          {salesWithheld.map((s, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 18, borderBottom: "1px solid #1F2937" }}>
              <span>{s.entry_date} - {s.customer_name}</span>
              <span style={theme.numberStyle}>{s.withheld_by_customer.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {purchaseWithheld.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Retenciones Efectuadas a Proveedores</h2>
            <button onClick={exportTxt} style={{ ...theme.buttonStyle, fontSize: 15, padding: "10px 20px" }}>
              Exportar TXT (Formato SENIAT)
            </button>
          </div>
          {purchaseWithheld.map((p, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 18, borderBottom: "1px solid #1F2937" }}>
              <span>{p.entry_date} - {p.vendor_name} (Comp. {p.withholding_receipt_number})</span>
              <span style={theme.numberStyle}>{p.withheld_amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Resumenes Guardados</h2>
          {history.map((h) => (
            <div key={h.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 20 }}>
              {h.period_start} a {h.period_end} - Neto: <span style={theme.numberStyle}>{h.net_withholding_position?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
