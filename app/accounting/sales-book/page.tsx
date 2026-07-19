"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function SalesBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [arAccountId, setArAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");
  const [vatPayableAccountId, setVatPayableAccountId] = useState("");

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [controlNumber, setControlNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [taxableBaseGeneral, setTaxableBaseGeneral] = useState("");
  const [isExempt, setIsExempt] = useState(false);
  const [message, setMessage] = useState("");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("sales_book_entries").select("*").eq("company_id", cid).order("entry_date", { ascending: false });
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
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "REVENUE", "LIABILITY"]);
        setAccounts(acc ?? []);
        const vatPayableDefault = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("iva por pagar"));
        if (vatPayableDefault) setVatPayableAccountId(vatPayableDefault.id);
        await loadEntries(cid);
      }
    }
    load();
  }, []);
  async function createEntry() {
    setMessage("");
    if (!companyId || !customerName || !customerTaxId || !taxableBaseGeneral || !arAccountId || !revenueAccountId || !vatPayableAccountId) {
      setMessage("Completa todos los campos obligatorios y las 3 cuentas contables.");
      return;
    }

    const base = parseFloat(taxableBaseGeneral) || 0;
    const debit = isExempt ? 0 : base * 0.16;
    const total = base + debit;
    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Venta " + invoiceNumber + " - " + customerName,
      entry_date: entryDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const lines = [{ journal_entry_id: entry.id, account_id: arAccountId, debit: total, credit: 0 }];
    lines.push({ journal_entry_id: entry.id, account_id: revenueAccountId, debit: 0, credit: base });
    if (debit > 0) {
      lines.push({ journal_entry_id: entry.id, account_id: vatPayableAccountId, debit: 0, credit: debit });
    }

    const { error: linesError } = await supabase.from("journal_lines").insert(lines);
    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); return; }

    const { error: bookError } = await supabase.from("sales_book_entries").insert([{
      company_id: companyId,
      entry_number: nextNumber,
      entry_date: entryDate,
      invoice_number: invoiceNumber,
      control_number: controlNumber,
      customer_name: customerName,
      customer_tax_id: customerTaxId,
      is_exempt: isExempt,
      taxable_base_general: isExempt ? 0 : base,
      fiscal_debit: debit,
      journal_entry_id: entry.id,
    }]);

    if (bookError) { setMessage("Error al guardar en Libro de Ventas: " + bookError.message); return; }

    setMessage("Venta registrada en el Libro de Ventas y asiento contable generado automaticamente.");
    setInvoiceNumber(""); setControlNumber(""); setCustomerName(""); setCustomerTaxId(""); setTaxableBaseGeneral(""); setIsExempt(false);
    await loadEntries(companyId);
  }

  async function importWithholdingTxt(file: File) {
    setMessage("Procesando archivo...");
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    let updated = 0;
    let notFound = 0;

    for (const line of lines) {
      const cols = line.split("\t");
      if (cols.length < 13) continue;

      const invoiceNumber = cols[6];
      const withheldAmount = parseFloat(cols[10]) || 0;
      const receiptNumber = cols[12];

      if (!invoiceNumber || withheldAmount === 0) continue;

      const { data: matchingEntry } = await supabase
        .from("sales_book_entries")
        .select("id")
        .eq("company_id", companyId)
        .eq("invoice_number", invoiceNumber)
        .limit(1)
        .single();

      if (matchingEntry) {
        await supabase.from("sales_book_entries").update({
          withheld_by_customer: withheldAmount,
        }).eq("id", matchingEntry.id);
        updated++;
      } else {
        notFound++;
      }
    }

    setMessage("Importacion completa: " + updated + " facturas actualizadas" + (notFound > 0 ? ", " + notFound + " no encontradas (verifica el numero de factura)." : "."));
    if (companyId) await loadEntries(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Ventas IVA" subtitle="Registro conforme al Art. 75 del Reglamento de la Ley de IVA - Venezuela" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={inputStyle} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={inputStyle} placeholder="Nº de Factura" />
          <input value={controlNumber} onChange={(e) => setControlNumber(e.target.value)} style={inputStyle} placeholder="Nº de Control" />
        </div>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Nombre/Razon Social del Comprador" />
        <input value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="RIF del Comprador" />
        <input type="number" value={taxableBaseGeneral} onChange={(e) => setTaxableBaseGeneral(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Base Imponible" />
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 18 }}>
          <input type="checkbox" checked={isExempt} onChange={(e) => setIsExempt(e.target.checked)} />
          Venta Exenta (sin IVA)
        </label>

        <select value={arAccountId} onChange={(e) => setArAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 12 }}>
          <option value="">Cuenta de Cuentas por Cobrar</option>
          {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={revenueAccountId} onChange={(e) => setRevenueAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="">Cuenta de Ingreso</option>
          {accounts.filter(a => a.account_type === "REVENUE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={vatPayableAccountId} onChange={(e) => setVatPayableAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="">Cuenta de IVA Debito Fiscal por Pagar</option>
          {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>

        <button onClick={createEntry} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR VENTA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Registros del Periodo</h2>
            <label style={{ ...theme.buttonStyle, fontSize: 15, padding: "10px 20px", cursor: "pointer" }}>
              Importar Retenciones TXT
              <input type="file" accept=".txt" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importWithholdingTxt(f); }} />
            </label>
          </div>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 17, fontWeight: 700 }}>
                <th style={{ padding: 8 }}>Nº</th>
                <th style={{ padding: 8 }}>Fecha</th>
                <th style={{ padding: 8 }}>Factura</th>
                <th style={{ padding: 8 }}>Comprador</th>
                <th style={{ padding: 8 }}>RIF</th>
                <th style={{ padding: 8, textAlign: "right" }}>Base Imponible</th>
                <th style={{ padding: 8, textAlign: "right" }}>Debito Fiscal</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.entry_number}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.entry_date}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.invoice_number}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.customer_name}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.customer_tax_id}</td>
                  <td style={{ padding: 8, textAlign: "right", fontSize: 20, ...theme.numberStyle }}>{e.taxable_base_general.toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", fontSize: 20, ...theme.numberStyle }}>{e.fiscal_debit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VerticalPageLayout>
  );
}
