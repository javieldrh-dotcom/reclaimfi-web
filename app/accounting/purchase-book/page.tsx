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
  const [vatWithholdingAccountId, setVatWithholdingAccountId] = useState("");
  const [isProfessionalService, setIsProfessionalService] = useState(false);
  const [islrRate, setIslrRate] = useState("5");
  const [islrWithholdingAccountId, setIslrWithholdingAccountId] = useState("");

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD");
  const [invoiceExchangeRate, setInvoiceExchangeRate] = useState("1");
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
    const { data } = await supabase.from("purchase_book_entries").select("*").eq("company_id", cid).eq("status", "ACTIVE").order("entry_date", { ascending: true });
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
        const apDefault = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("proveedores nacionales"));
        if (apDefault) setApAccountId(apDefault.id);
        const vatWithDefault = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("retenciones de iva por enterar"));
        if (vatWithDefault) setVatWithholdingAccountId(vatWithDefault.id);
        const islrWithDefault = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("retenciones de islr por enterar"));
        if (islrWithDefault) setIslrWithholdingAccountId(islrWithDefault.id);
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

  async function lookupVendorMemory(rif: string) {
    if (!companyId || !rif || rif.length < 5) return;
    const { data } = await supabase.from("vendor_account_memory").select("*").eq("company_id", companyId).eq("vendor_tax_id", rif).maybeSingle();
    if (data) {
      if (data.expense_account_id) setExpenseAccountId(data.expense_account_id);
      if (data.vat_credit_account_id) setVatCreditAccountId(data.vat_credit_account_id);
      if (data.vat_withholding_account_id) setVatWithholdingAccountId(data.vat_withholding_account_id);
      if (data.islr_withholding_account_id) setIslrWithholdingAccountId(data.islr_withholding_account_id);
      if (data.ap_account_id) setApAccountId(data.ap_account_id);
      setIsProfessionalService(!!data.used_islr);
      setMessage("Cuentas autocompletadas segun el historial de este proveedor.");
    }
  }

  async function saveVendorMemory(rif: string) {
    if (!companyId || !rif) return;
    await supabase.from("vendor_account_memory").upsert([{
      company_id: companyId,
      vendor_tax_id: rif,
      expense_account_id: expenseAccountId || null,
      vat_credit_account_id: vatCreditAccountId || null,
      vat_withholding_account_id: vatWithholdingAccountId || null,
      islr_withholding_account_id: islrWithholdingAccountId || null,
      ap_account_id: apAccountId || null,
      used_islr: isProfessionalService,
      updated_at: new Date().toISOString(),
    }], { onConflict: "company_id,vendor_tax_id" });
  }

  async function createNewAccount(type: string, target: string) {
    const name = window.prompt("Nombre de la nueva cuenta:");
    if (!name || !companyId) return;
    const prefix = type === "EXPENSE" ? "5199" : type === "LIABILITY" ? "2199" : "1199";
    const { data: newAcc, error } = await supabase.from("chart_of_accounts").insert([{
      account_code: prefix + "-" + Date.now().toString().slice(-4),
      account_name: name,
      account_type: type,
      company_id: companyId,
    }]).select("id, account_code, account_name, account_type").single();
    if (error || !newAcc) { alert("Error al crear cuenta: " + error?.message); return; }
    setAccounts((prev) => [...prev, newAcc]);
    if (target === "expense") setExpenseAccountId(newAcc.id);
    if (target === "vatcredit") setVatCreditAccountId(newAcc.id);
    if (target === "ap") setApAccountId(newAcc.id);
    if (target === "withholding") setVatWithholdingAccountId(newAcc.id);
    if (target === "islr") setIslrWithholdingAccountId(newAcc.id);
  }

  async function reverseEntry(entryId: string, journalEntryId: string, vendorNameLocal: string) {
    if (!companyId || !journalEntryId) return;
    if (!window.confirm("Se creara un asiento contable de reverso (cifras invertidas). El registro fiscal original permanecera intacto. Confirmar?")) return;

    const { data: origEntry } = await supabase.from("journal_entries").select("entry_number, description").eq("id", journalEntryId).single();
    const { data: origLines } = await supabase.from("journal_lines").select("account_id, debit, credit").eq("journal_entry_id", journalEntryId);

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;
    const today = new Date().toISOString().slice(0, 10);

    const { data: newEntry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Reverso del Asiento Nº" + (origEntry?.entry_number ?? "S/N") + " - " + (origEntry?.description ?? vendorNameLocal),
      entry_date: today,
      entry_number: nextNumber,
      reversal_of_entry_id: journalEntryId,
    }]).select("id").single();
    if (entryError || !newEntry) { alert("Error al crear reverso: " + entryError?.message); return; }

    const reversedLines = (origLines ?? []).map((l: any) => ({
      journal_entry_id: newEntry.id,
      account_id: l.account_id,
      debit: l.credit || 0,
      credit: l.debit || 0,
    }));
    await supabase.from("journal_lines").insert(reversedLines);
    await supabase.from("journal_entries").update({ reversed_by_entry_id: newEntry.id }).eq("id", journalEntryId);

    alert("Reverso creado correctamente (Asiento Nº" + nextNumber + "). El registro fiscal original se mantiene intacto.");
    if (companyId) await loadEntries(companyId);
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
    const islrWithheld = isProfessionalService ? base * (parseFloat(islrRate) / 100) : 0;
    const totalDocument = base + credit + nonTaxable;
    const netPayable = totalDocument - withheld - islrWithheld;
    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Compra " + invoiceNumber + " - " + vendorName,
      entry_date: entryDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }
    const fxRate = parseFloat(invoiceExchangeRate) || 1;
    const lines = [{ journal_entry_id: entry.id, account_id: expenseAccountId, debit: (base + nonTaxable) * fxRate, credit: 0 }];
    if (credit > 0) {
      lines.push({ journal_entry_id: entry.id, account_id: vatCreditAccountId, debit: credit * fxRate, credit: 0 });
    }
    if (withheld > 0) {
      lines.push({ journal_entry_id: entry.id, account_id: vatWithholdingAccountId, debit: 0, credit: withheld * fxRate });
    }
    if (islrWithheld > 0) {
      lines.push({ journal_entry_id: entry.id, account_id: islrWithholdingAccountId, debit: 0, credit: islrWithheld * fxRate });
    }
    lines.push({ journal_entry_id: entry.id, account_id: apAccountId, debit: 0, credit: netPayable * fxRate });

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
      non_taxable_amount: nonTaxable * fxRate,
      taxable_base_general: isImport ? 0 : base * fxRate,
      rate_general: rate,
      fiscal_credit: isImport ? 0 : credit * fxRate,
      import_taxable_base: isImport ? base * fxRate : 0,
      import_rate: isImport ? rate : 0,
      import_tax: isImport ? credit * fxRate : 0,
      total_document_amount: totalDocument * fxRate,
      withholding_receipt_number: withholdingReceiptNumber,
      withheld_amount: withheld * fxRate,
      islr_withheld: islrWithheld * fxRate,
      is_professional_service: isProfessionalService,
      journal_entry_id: entry.id,
    }]);

    if (bookError) { setMessage("Error al guardar en Libro de Compras: " + bookError.message); return; }

    setMessage("Compra registrada en el Libro de Compras y asiento contable generado automaticamente.");
    await saveVendorMemory(vendorTaxId);
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
          <select value={invoiceCurrency} onChange={(e) => setInvoiceCurrency(e.target.value)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="VES">VES (Bolivares)</option>
          </select>
          <input type="number" step="0.0001" value={invoiceExchangeRate} onChange={(e) => setInvoiceExchangeRate(e.target.value)} style={inputStyle} placeholder="Tasa de Cambio" />
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
        <input value={vendorTaxId} onChange={(e) => setVendorTaxId(e.target.value)} onBlur={(e) => lookupVendorMemory(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="RIF del Vendedor" />

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
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 15 }}>
          <input type="checkbox" checked={isProfessionalService} onChange={(e) => setIsProfessionalService(e.target.checked)} />
          Es Servicio Profesional (aplica retencion ISLR)
        </label>
        {isProfessionalService && (
          <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
            <input type="number" value={islrRate} onChange={(e) => setIslrRate(e.target.value)} style={{ ...inputStyle, width: 100 }} placeholder="Tasa ISLR %" />
            <p style={{ fontSize: 15, color: theme.accent }}>ISLR a Retener: {((parseFloat(taxableBaseGeneral) || 0) * (parseFloat(islrRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        )}
        <h4 style={{ fontSize: 14, color: "#8B93A7", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Gasto</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Gasto</option>
            {accounts.filter(a => a.account_type === "EXPENSE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("EXPENSE", "expense")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>

        <h4 style={{ fontSize: 14, color: "#8B93A7", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Impuesto</h4>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={vatCreditAccountId} onChange={(e) => setVatCreditAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de IVA Credito Fiscal</option>
            {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("ASSET", "vatcredit")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>

        <h4 style={{ fontSize: 14, color: "#8B93A7", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Retenciones (si aplican)</h4>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={vatWithholdingAccountId} onChange={(e) => setVatWithholdingAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Retencion de IVA por Enterar</option>
            {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("LIABILITY", "withholding")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <select value={islrWithholdingAccountId} onChange={(e) => setIslrWithholdingAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Retencion de ISLR por Enterar</option>
            {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("LIABILITY", "islr")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>

        <h4 style={{ fontSize: 14, color: "#8B93A7", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Pago (Neto)</h4>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={apAccountId} onChange={(e) => setApAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Cuentas por Pagar</option>
            {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={() => createNewAccount("LIABILITY", "ap")} style={{ padding: "0 16px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>+ Nueva</button>
        </div>
        {taxableBaseGeneral && expenseAccountId && (() => {
          const pBase = parseFloat(taxableBaseGeneral) || 0;
          const pRate = parseFloat(rateGeneral) || 16;
          const pIva = pBase * (pRate / 100);
          const pWithheldPct = parseFloat(withholdingPercentage) || 0;
          const pWithheld = pIva * (pWithheldPct / 100);
          const pIslr = isProfessionalService ? pBase * (parseFloat(islrRate) / 100) : 0;
          const pNet = pBase + pIva + (parseFloat(nonTaxableAmount) || 0) - pWithheld - pIslr;
          const nameOf = (id: string) => { const a = accounts.find((x) => x.id === id); return a ? a.account_code + " - " + a.account_name : "(sin seleccionar)"; };
          const totalDebe = pBase + pIva;
          const totalHaber = pWithheld + pIslr + pNet;
          const cuadra = Math.abs(totalDebe - totalHaber) < 0.01;
          return (
            <div style={{ ...theme.cardStyle, marginTop: 16, border: "1px solid " + theme.accent }}>
              <p style={{ fontSize: 15, color: "#B0B8C8", marginBottom: 12, lineHeight: 1.6 }}>
                Vas a registrar <b style={{ color: theme.accent }}>{pBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b> de {expenseAccountId ? accounts.find(a => a.id === expenseAccountId)?.account_name : "Gasto"} pagado a <b>{vendorName || "el proveedor"}</b>.
                {pWithheld > 0 && <> Se retendra <b>{pWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b> de IVA.</>}
                {pIslr > 0 && <> Se retendra <b>{pIslr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b> de ISLR.</>}
                {" "}Neto a pagar: <b style={{ color: "#4ade80" }}>{pNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>
                <span>VISTA PREVIA DEL ASIENTO</span>
                <span style={{ color: cuadra ? "#4ade80" : "#f87171" }}>{cuadra ? "✓ Cuadra" : "✗ No Cuadra"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}><span>{nameOf(expenseAccountId)}</span><span style={theme.numberStyle}>Debe {pBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              {pIva > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}><span>{nameOf(vatCreditAccountId)}</span><span style={theme.numberStyle}>Debe {pIva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
              {pWithheld > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}><span>{nameOf(vatWithholdingAccountId)}</span><span style={theme.numberStyle}>Haber {pWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
              {pIslr > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}><span>{nameOf(islrWithholdingAccountId)}</span><span style={theme.numberStyle}>Haber {pIslr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0", borderTop: "1px solid #1F2937", marginTop: 4, paddingTop: 8, fontWeight: 700 }}><span>{nameOf(apAccountId)}</span><span style={theme.numberStyle}>Haber {pNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>
          );
        })()}
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
                  <th style={{ border: "1px solid #1F2937", padding: 6 }}>Acciones</th>
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
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.import_taxable_base || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.import_rate || 0}%</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.import_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.non_taxable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.taxable_base_general || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{e.rate_general || 0}%</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.fiscal_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.total_document_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6 }}>{e.withholding_receipt_number || "-"}</td>
                    <td style={{ padding: 6, textAlign: "right", ...theme.numberStyle }}>{(e.withheld_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 6 }}>
                      <button onClick={() => reverseEntry(e.id, e.journal_entry_id, e.vendor_name)} style={{ background: "none", border: "1px solid #FB923C", color: "#FB923C", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                        Reversar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: "2px solid " + theme.accent }}>
                  <td colSpan={7} style={{ padding: 8 }}>TOTALES</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.import_taxable_base || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.import_tax || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.non_taxable_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.taxable_base_general || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.fiscal_credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.total_document_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td></td>
                  <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{entries.reduce((s, e) => s + (e.withheld_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ ...theme.cardStyle, marginTop: 24, maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>RESUMEN LIBRO DE COMPRAS</h3>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Compras no gravadas o sin derecho a C.F.</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.non_taxable_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Importaciones gravadas alicuota general</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.import_taxable_base || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}><span>Compras internas gravadas alicuota general</span><span style={theme.numberStyle}>{entries.reduce((s, e) => s + (e.taxable_base_general || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 10, marginTop: 10, borderTop: "1px solid #1F2937", fontWeight: 700, fontSize: 17 }}><span>Total Creditos Fiscales</span><span style={theme.numberStyle}>{(entries.reduce((s, e) => s + (e.fiscal_credit || 0), 0) + entries.reduce((s, e) => s + (e.import_tax || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      )}
    </VerticalPageLayout>
  );
}
