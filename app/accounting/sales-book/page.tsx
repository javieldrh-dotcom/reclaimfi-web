"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateSalesBookPdf } from "@/app/core/reports/generateSalesBookPdf";

export default function SalesBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [arAccountId, setArAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");
  const [vatPayableAccountId, setVatPayableAccountId] = useState("");

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [documentType, setDocumentType] = useState("FACTURA");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [controlNumber, setControlNumber] = useState("");
  const [affectedDocument, setAffectedDocument] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [isExport, setIsExport] = useState(false);
  const [nonTaxableAmount, setNonTaxableAmount] = useState("0");
  const [taxableBaseGeneral, setTaxableBaseGeneral] = useState("");
  const [rateGeneral, setRateGeneral] = useState("16");
  const [withheldByCustomer, setWithheldByCustomer] = useState("0");
  const [message, setMessage] = useState("");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("sales_book_entries").select("*").eq("company_id", cid).order("entry_date", { ascending: true });
    setEntries(data ?? []);
  }

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
        setCompanyRif(companyData?.tax_id ?? "");
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "REVENUE", "LIABILITY"]);
        setAccounts(acc ?? []);
        const vatPayableDefault = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("iva por pagar"));
        if (vatPayableDefault) setVatPayableAccountId(vatPayableDefault.id);
        await loadEntries(cid);
      }
    }
    load();
  }, []);
  async function createNewAccount(type: string) {
    const name = window.prompt("Nombre de la nueva cuenta de " + (type === "REVENUE" ? "Ingreso" : "Activo") + ":");
    if (!name || !companyId) return;
    const prefix = type === "REVENUE" ? "4199" : "1199";
    const { data: newAcc, error } = await supabase.from("chart_of_accounts").insert([{
      account_code: prefix + "-" + Date.now().toString().slice(-4),
      account_name: name,
      account_type: type,
      company_id: companyId,
    }]).select("id, account_code, account_name, account_type").single();
    if (error || !newAcc) { alert("Error al crear cuenta: " + error?.message); return; }
    setAccounts((prev) => [...prev, newAcc]);
    if (type === "REVENUE") setRevenueAccountId(newAcc.id);
    if (type === "ASSET") setArAccountId(newAcc.id);
  }

  async function createEntry() {
    setMessage("");
    if (!companyId || !customerName || !customerTaxId || !taxableBaseGeneral || !arAccountId || !revenueAccountId || !vatPayableAccountId) {
      setMessage("Completa todos los campos obligatorios y las 3 cuentas contables.");
      return;
    }

    const base = parseFloat(taxableBaseGeneral) || 0;
    const rate = parseFloat(rateGeneral) || 16;
    const nonTaxable = parseFloat(nonTaxableAmount) || 0;
    const debit = isExport ? 0 : base * (rate / 100);
    const withheld = parseFloat(withheldByCustomer) || 0;
    const totalIncludingVat = base + debit + nonTaxable;
    const netReceivable = totalIncludingVat - withheld;
    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Venta " + invoiceNumber + " - " + customerName,
      entry_date: entryDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const lines = [{ journal_entry_id: entry.id, account_id: arAccountId, debit: netReceivable, credit: 0 }];
    lines.push({ journal_entry_id: entry.id, account_id: revenueAccountId, debit: 0, credit: base + nonTaxable });
    if (debit > 0) {
      lines.push({ journal_entry_id: entry.id, account_id: vatPayableAccountId, debit: 0, credit: debit });
    }

    const { error: linesError } = await supabase.from("journal_lines").insert(lines);
    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); return; }

    const { error: bookError } = await supabase.from("sales_book_entries").insert([{
      company_id: companyId,
      entry_number: nextNumber,
      entry_date: entryDate,
      document_type: documentType,
      invoice_number: invoiceNumber,
      control_number: controlNumber,
      affected_document_number: affectedDocument,
      customer_name: customerName,
      customer_tax_id: customerTaxId,
      is_export: isExport,
      non_taxable_amount: nonTaxable,
      taxable_base_general: isExport ? 0 : base,
      rate_general: rate,
      fiscal_debit: isExport ? 0 : debit,
      total_including_vat: totalIncludingVat,
      withheld_by_customer: withheld,
      journal_entry_id: entry.id,
    }]);

    if (bookError) { setMessage("Error al guardar en Libro de Ventas: " + bookError.message); return; }

    setMessage("Venta registrada en el Libro de Ventas y asiento contable generado automaticamente.");
    setInvoiceNumber(""); setControlNumber(""); setAffectedDocument(""); setCustomerName(""); setCustomerTaxId(""); setTaxableBaseGeneral(""); setNonTaxableAmount("0"); setIsExport(false); setWithheldByCustomer("0");
    await loadEntries(companyId);
  }

  async function importWithholdingTxt(file: File) {
    setMessage("Procesando archivo...");
    const text = await file.text();
    const linesTxt = text.split(/\r?\n/).filter((l) => l.trim());
    let updated = 0;
    let notFound = 0;
    for (const line of linesTxt) {
      const cols = line.split("\t");
      if (cols.length < 13) continue;
      const invoiceNum = cols[6];
      const withheldAmt = parseFloat(cols[10]) || 0;
      if (!invoiceNum || withheldAmt === 0) continue;
      const { data: matchingEntry } = await supabase.from("sales_book_entries").select("id").eq("company_id", companyId).eq("invoice_number", invoiceNum).limit(1).single();
      if (matchingEntry) {
        await supabase.from("sales_book_entries").update({ withheld_by_customer: withheldAmt }).eq("id", matchingEntry.id);
        updated++;
      } else {
        notFound++;
      }
    }
    setMessage("Importacion completa: " + updated + " facturas actualizadas" + (notFound > 0 ? ", " + notFound + " no encontradas." : "."));
    if (companyId) await loadEntries(companyId);
  }

  function downloadPdf() {
    const doc = generateSalesBookPdf(companyName, companyRif, entries);
    doc.save("libro-ventas-iva.pdf");
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 18 };

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Ventas IVA" subtitle="Conforme al Art. 75 del Reglamento de la Ley de IVA - Formato Oficial SENIAT" fullWidth
      actions={entries.length > 0 ? (
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      ) : undefined}
    >
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={inputStyle} />
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} style={inputStyle}>
            <option value="FACTURA">Factura</option>
            <option value="NOTA_DEBITO">Nota de Debito</option>
            <option value="NOTA_CREDITO">Nota de Credito</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={inputStyle} placeholder="Nº de Documento" />
          <input value={controlNumber} onChange={(e) => setControlNumber(e.target.value)} style={inputStyle} placeholder="Nº de Control" />
          <input value={affectedDocument} onChange={(e) => setAffectedDocument(e.target.value)} style={inputStyle} placeholder="Nº Factura Afectada (si N/C o N/D)" />
        </div>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Nombre/Razon Social del Comprador" />
        <input value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="RIF del Comprador" />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 16 }}>
          <input type="checkbox" checked={isExport} onChange={(e) => setIsExport(e.target.checked)} />
          Es una Venta de Exportacion
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input type="number" value={taxableBaseGeneral} onChange={(e) => setTaxableBaseGeneral(e.target.value)} style={inputStyle} placeholder="Base Imponible" />
          <input type="number" value={rateGeneral} onChange={(e) => setRateGeneral(e.target.value)} style={inputStyle} placeholder="Alicuota %" />
          <input type="number" value={nonTaxableAmount} onChange={(e) => setNonTaxableAmount(e.target.value)} style={inputStyle} placeholder="Ventas No Gravadas" />
        </div>

        <label style={{ ...theme.buttonStyle, fontSize: 14, padding: "8px 16px", cursor: "pointer", display: "inline-block", marginTop: 12 }}>
          Importar Retenciones TXT
          <input type="file" accept=".txt" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importWithholdingTxt(f); }} />
        </label>

        <div style={{ marginTop: 8 }}>
          <input type="number" value={withheldByCustomer} onChange={(e) => setWithheldByCustomer(e.target.value)} style={inputStyle} placeholder="IVA Retenido por el Comprador (manual)" />
        </div>

        <select value={arAccountId} onChange={(e) => setArAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 12 }}>
          <option value="">Cuenta de Cuentas por Cobrar</option>
          {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <select value={revenueAccountId} onChange={(e) => setRevenueAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Ingreso</option>
            {accounts.filter(a => a.account_type === "REVENUE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("REVENUE")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>
        <select value={vatPayableAccountId} onChange={(e) => setVatPayableAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="">Cuenta de IVA Debito Fiscal</option>
          {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>

        <button onClick={createEntry} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR VENTA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>{companyName} - RIF: {companyRif}</h2>
          <h3 style={{ fontSize: 20, color: "#B0B8C8", marginTop: 4 }}>LIBRO DE VENTAS IVA</h3>

          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ borderCollapse: "collapse", minWidth: 1500, fontSize: 13 }}>
              <thead>
                <tr style={{ color: theme.accent, fontWeight: 700 }}>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Ope. Nº</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Fecha</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>RIF Comprador</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Razon Social</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Tipo Doc.</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Nº Doc.</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Nº Control</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Ventas Exportacion</th>
                  <th colSpan={5} style={{ border: "1px solid #1F2937", padding: 6, background: "#2DD4BF20" }}>VENTAS INTERNAS</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6, background: "#FB923C20" }}>IVA Retenido</th>
                </tr>
                <tr style={{ color: theme.accent, fontWeight: 700 }}>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Total c/IVA</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>No Gravadas</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Base Imp.</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Alicuota</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Debito Fiscal</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.entry_number}</td>
                    <td style={{ padding: 6 }}>{e.entry_date}</td>
                    <td style={{ padding: 6 }}>{e.customer_tax_id}</td>
                    <td style={{ padding: 6 }}>{e.customer_name}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.document_type}</td>
                    <td style={{ padding: 6 }}>{e.invoice_number}</td>
                    <td style={{ padding: 6 }}>{e.control_number}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{e.is_export ? (e.total_including_vat || 0).toLocaleString() : "0"}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.total_including_vat || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.non_taxable_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.taxable_base_general || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.rate_general || 0}%</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.fiscal_debit || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.withheld_by_customer || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: "2px solid " + theme.accent }}>
                  <td colSpan={7} style={{ padding: 8 }}>TOTALES</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.filter(e => e.is_export).reduce((s, e) => s + (e.total_including_vat || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.total_including_vat || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.non_taxable_amount || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.taxable_base_general || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.fiscal_debit || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.withheld_by_customer || 0), 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ ...theme.cardStyle, marginTop: 24, maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>RESUMEN LIBRO DE VENTAS</h3>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Ventas internas no gravadas</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.non_taxable_amount || 0), 0).toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Ventas de exportacion</span><span style={theme.numberStyle}>{entries.filter(e => e.is_export).reduce((s, e) => s + (e.total_including_vat || 0), 0).toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Ventas internas gravadas alicuota general</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.taxable_base_general || 0), 0).toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 10, marginTop: 10, borderTop: "1px solid #1F2937", fontWeight: 700, fontSize: 17 }}><span>Total Debitos Fiscales</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.fiscal_debit || 0), 0).toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </VerticalPageLayout>
  );
}
