"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import { generatePurchaseBookPdf } from "@/app/core/reports/generatePurchaseBookPdf";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function PurchaseBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [apAccountId, setApAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [vatCreditAccountId, setVatCreditAccountId] = useState("");

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [documentType, setDocumentType] = useState("FACTURA");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [controlNumber, setControlNumber] = useState("");
  const [affectedDocument, setAffectedDocument] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorTaxId, setVendorTaxId] = useState("");
  const [isImport, setIsImport] = useState(false);
  const [nonTaxableAmount, setNonTaxableAmount] = useState("0");
  const [taxableBaseGeneral, setTaxableBaseGeneral] = useState("");
  const [rateGeneral, setRateGeneral] = useState("16");
  const [withholdingReceiptNumber, setWithholdingReceiptNumber] = useState("");
  const [withholdingPercentage, setWithholdingPercentage] = useState("0");
  const [withheldAmount, setWithheldAmount] = useState("0");
  const [message, setMessage] = useState("");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("purchase_book_entries").select("*").eq("company_id", cid).order("entry_date", { ascending: true });
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
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "EXPENSE"]);
        setAccounts(acc ?? []);
        const vatCreditDefault = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("credito fiscal"));
        if (vatCreditDefault) setVatCreditAccountId(vatCreditDefault.id);
        await loadEntries(cid);
      }
    }
    load();
  }, []);
  useEffect(() => {
    const base = parseFloat(taxableBaseGeneral) || 0;
    const rate = parseFloat(rateGeneral) || 16;
    const pct = parseFloat(withholdingPercentage) || 0;
    const iva = base * (rate / 100);
    const calculated = iva * (pct / 100);
    setWithheldAmount(calculated.toFixed(2));
  }, [taxableBaseGeneral, rateGeneral, withholdingPercentage]);

  useEffect(() => {
    const base = parseFloat(taxableBaseGeneral) || 0;
    const rate = parseFloat(rateGeneral) || 16;
    const pct = parseFloat(withholdingPercentage) || 0;
    const iva = base * (rate / 100);
    const calculated = iva * (pct / 100);
    setWithheldAmount(calculated.toFixed(2));
  }, [taxableBaseGeneral, rateGeneral, withholdingPercentage]);

  async function createNewAccount(type: string) {
    const name = window.prompt("Nombre de la nueva cuenta de " + (type === "EXPENSE" ? "Gasto" : "Activo") + ":");
    if (!name || !companyId) return;
    const prefix = type === "EXPENSE" ? "5199" : "1199";
    const { data: newAcc, error } = await supabase.from("chart_of_accounts").insert([{
      account_code: prefix + "-" + Date.now().toString().slice(-4),
      account_name: name,
      account_type: type,
      company_id: companyId,
    }]).select("id, account_code, account_name, account_type").single();
    if (error || !newAcc) { alert("Error al crear cuenta: " + error?.message); return; }
    setAccounts((prev) => [...prev, newAcc]);
    if (type === "EXPENSE") setExpenseAccountId(newAcc.id);
    if (type === "ASSET") setVatCreditAccountId(newAcc.id);
  }

  async function createEntry() {
    setMessage("");
    if (!companyId || !vendorName || !vendorTaxId || !taxableBaseGeneral || !apAccountId || !expenseAccountId || !vatCreditAccountId) {
      setMessage("Completa todos los campos obligatorios y las 3 cuentas contables.");
      return;
    }

    const base = parseFloat(taxableBaseGeneral) || 0;
    const rate = parseFloat(rateGeneral) || 16;
    const nonTaxable = parseFloat(nonTaxableAmount) || 0;
    const credit = base * (rate / 100);
    const withheld = parseFloat(withheldAmount) || 0;
    const totalDocument = base + credit + nonTaxable;
    const netPayable = totalDocument - withheld;
    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Compra " + invoiceNumber + " - " + vendorName,
      entry_date: entryDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const lines = [{ journal_entry_id: entry.id, account_id: expenseAccountId, debit: base + nonTaxable, credit: 0 }];
    if (credit > 0) {
      lines.push({ journal_entry_id: entry.id, account_id: vatCreditAccountId, debit: credit, credit: 0 });
    }
    lines.push({ journal_entry_id: entry.id, account_id: apAccountId, debit: 0, credit: netPayable });

    const { error: linesError } = await supabase.from("journal_lines").insert(lines);
    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); return; }

    const { error: bookError } = await supabase.from("purchase_book_entries").insert([{
      company_id: companyId,
      entry_number: nextNumber,
      entry_date: entryDate,
      document_type: documentType,
      invoice_number: invoiceNumber,
      control_number: controlNumber,
      affected_document_number: affectedDocument,
      vendor_name: vendorName,
      vendor_tax_id: vendorTaxId,
      is_import: isImport,
      non_taxable_amount: nonTaxable,
      taxable_base_general: isImport ? 0 : base,
      rate_general: rate,
      fiscal_credit: isImport ? 0 : credit,
      import_taxable_base: isImport ? base : 0,
      import_rate: isImport ? rate : 0,
      import_tax: isImport ? credit : 0,
      total_document_amount: totalDocument,
      withholding_receipt_number: withholdingReceiptNumber,
      withheld_amount: withheld,
      journal_entry_id: entry.id,
    }]);

    if (bookError) { setMessage("Error al guardar en Libro de Compras: " + bookError.message); return; }

    setMessage("Compra registrada en el Libro de Compras y asiento contable generado automaticamente.");
    setInvoiceNumber(""); setControlNumber(""); setAffectedDocument(""); setVendorName(""); setVendorTaxId(""); setTaxableBaseGeneral(""); setNonTaxableAmount("0"); setIsImport(false); setWithholdingReceiptNumber(""); setWithheldAmount("0");
    await loadEntries(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 18 };

  function downloadPdf() {
    const doc = generatePurchaseBookPdf(companyName, companyRif, entries);
    doc.save("libro-compras-iva.pdf");
  }

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Compras IVA" subtitle="Conforme al Art. 77 del Reglamento de la Ley de IVA - Formato Oficial SENIAT" fullWidth
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
        <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Nombre/Razon Social del Vendedor" />
        <input value={vendorTaxId} onChange={(e) => setVendorTaxId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="RIF del Vendedor" />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 16 }}>
          <input type="checkbox" checked={isImport} onChange={(e) => setIsImport(e.target.checked)} />
          Es una Importacion (en vez de Compra Interna)
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input type="number" value={taxableBaseGeneral} onChange={(e) => setTaxableBaseGeneral(e.target.value)} style={inputStyle} placeholder="Base Imponible" />
          <input type="number" value={rateGeneral} onChange={(e) => setRateGeneral(e.target.value)} style={inputStyle} placeholder="Alicuota %" />
          <input type="number" value={nonTaxableAmount} onChange={(e) => setNonTaxableAmount(e.target.value)} style={inputStyle} placeholder="Compras No Gravadas" />
        </div>

        <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16 }}>Retencion de IVA (si aplica)</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={withholdingReceiptNumber} onChange={(e) => setWithholdingReceiptNumber(e.target.value)} style={inputStyle} placeholder="Nº Comprobante de Retencion" />
          <select value={withholdingPercentage} onChange={(e) => setWithholdingPercentage(e.target.value)} style={inputStyle}>
            <option value="0">Sin Retencion</option>
            <option value="75">75% (Estandar)</option>
            <option value="100">100% (Art. 5 - Casos Especiales)</option>
          </select>
        </div>
        {parseFloat(withholdingPercentage) > 0 && (
          <p style={{ marginTop: 6, fontSize: 15, color: theme.accent }}>Monto Retenido Calculado: {parseFloat(withheldAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        )}

        <select value={apAccountId} onChange={(e) => setApAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 12 }}>
          <option value="">Cuenta de Cuentas por Pagar</option>
          {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <select value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Gasto</option>
            {accounts.filter(a => a.account_type === "EXPENSE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("EXPENSE")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>
        <select value={vatCreditAccountId} onChange={(e) => setVatCreditAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="">Cuenta de IVA Credito Fiscal</option>
          {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>

        <button onClick={createEntry} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR COMPRA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>{companyName} - RIF: {companyRif}</h2>
          <h3 style={{ fontSize: 20, color: "#B0B8C8", marginTop: 4 }}>LIBRO DE COMPRAS IVA</h3>

          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ borderCollapse: "collapse", minWidth: 1600, fontSize: 13 }}>
              <thead>
                <tr style={{ color: theme.accent, fontWeight: 700 }}>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Ope. Nº</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Fecha</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>RIF Vendedor</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Razon Social</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Tipo Doc.</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Nº Doc.</th>
                  <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 6 }}>Nº Control</th>
                  <th colSpan={3} style={{ border: "1px solid #1F2937", padding: 6, background: "#818CF820" }}>COMPRAS IMPORTACION</th>
                  <th colSpan={5} style={{ border: "1px solid #1F2937", padding: 6, background: "#2DD4BF20" }}>COMPRAS INTERNAS</th>
                  <th colSpan={2} style={{ border: "1px solid #1F2937", padding: 6, background: "#FB923C20" }}>RETENCION</th>
                </tr>
                <tr style={{ color: theme.accent, fontWeight: 700 }}>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Base Imp.</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Alicuota</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Impuesto</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>No Gravada</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Base Imp.</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Alicuota</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>IVA</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Total c/IVA</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Nº Comprob.</th>
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.entry_number}</td>
                    <td style={{ padding: 6 }}>{e.entry_date}</td>
                    <td style={{ padding: 6 }}>{e.vendor_tax_id}</td>
                    <td style={{ padding: 6 }}>{e.vendor_name}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.document_type}</td>
                    <td style={{ padding: 6 }}>{e.invoice_number}</td>
                    <td style={{ padding: 6 }}>{e.control_number}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.import_taxable_base || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.import_rate || 0}%</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.import_tax || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.non_taxable_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.taxable_base_general || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.rate_general || 0}%</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.fiscal_credit || 0).toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.total_document_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>{e.withholding_receipt_number || "-"}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.withheld_amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: "2px solid " + theme.accent }}>
                  <td colSpan={7} style={{ padding: 8 }}>TOTALES</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.import_taxable_base || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.import_tax || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.non_taxable_amount || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.taxable_base_general || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.fiscal_credit || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.total_document_amount || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.withheld_amount || 0), 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ ...theme.cardStyle, marginTop: 24, maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>RESUMEN LIBRO DE COMPRAS</h3>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Compras no gravadas o sin derecho a C.F.</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.non_taxable_amount || 0), 0).toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Importaciones gravadas alicuota general</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.import_taxable_base || 0), 0).toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Compras internas gravadas alicuota general</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.taxable_base_general || 0), 0).toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 10, marginTop: 10, borderTop: "1px solid #1F2937", fontWeight: 700, fontSize: 17 }}><span>Total Creditos Fiscales</span><span style={theme.numberStyle}>{(entries.reduce((s, e) => s + (e.fiscal_credit || 0), 0) + entries.reduce((s, e) => s + (e.import_tax || 0), 0)).toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </VerticalPageLayout>
  );
}
