"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function PurchaseBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [apAccountId, setApAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [vatCreditAccountId, setVatCreditAccountId] = useState("");

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [controlNumber, setControlNumber] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorTaxId, setVendorTaxId] = useState("");
  const [taxableBaseGeneral, setTaxableBaseGeneral] = useState("");
  const [isNonDeductible, setIsNonDeductible] = useState(false);
  const [withholdingReceiptNumber, setWithholdingReceiptNumber] = useState("");
  const [withheldAmount, setWithheldAmount] = useState("");
  const [message, setMessage] = useState("");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("purchase_book_entries").select("*").eq("company_id", cid).order("entry_date", { ascending: false });
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
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "EXPENSE"]);
        setAccounts(acc ?? []);
        await loadEntries(cid);
      }
    }
    load();
  }, []);
  async function createEntry() {
    setMessage("");
    if (!companyId || !vendorName || !vendorTaxId || !taxableBaseGeneral || !apAccountId || !expenseAccountId || !vatCreditAccountId) {
      setMessage("Completa todos los campos obligatorios y las 3 cuentas contables.");
      return;
    }

    const base = parseFloat(taxableBaseGeneral) || 0;
    const credit = isNonDeductible ? 0 : base * 0.16;
    const withheld = parseFloat(withheldAmount) || 0;
    const total = base + credit;
    const netPayable = total - withheld;
    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Compra " + invoiceNumber + " - " + vendorName,
      entry_date: entryDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const lines = [{ journal_entry_id: entry.id, account_id: expenseAccountId, debit: base, credit: 0 }];
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
      invoice_number: invoiceNumber,
      control_number: controlNumber,
      vendor_name: vendorName,
      vendor_tax_id: vendorTaxId,
      is_non_deductible: isNonDeductible,
      taxable_base_general: isNonDeductible ? 0 : base,
      fiscal_credit: credit,
      withholding_receipt_number: withholdingReceiptNumber,
      withheld_amount: withheld,
      journal_entry_id: entry.id,
    }]);

    if (bookError) { setMessage("Error al guardar en Libro de Compras: " + bookError.message); return; }

    setMessage("Compra registrada en el Libro de Compras y asiento contable generado automaticamente.");
    setInvoiceNumber(""); setControlNumber(""); setVendorName(""); setVendorTaxId(""); setTaxableBaseGeneral(""); setIsNonDeductible(false); setWithholdingReceiptNumber(""); setWithheldAmount("");
    await loadEntries(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Compras IVA" subtitle="Registro conforme al Art. 77 del Reglamento de la Ley de IVA - Venezuela" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={inputStyle} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={inputStyle} placeholder="Nº de Factura" />
          <input value={controlNumber} onChange={(e) => setControlNumber(e.target.value)} style={inputStyle} placeholder="Nº de Control" />
        </div>
        <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Nombre/Razon Social del Vendedor" />
        <input value={vendorTaxId} onChange={(e) => setVendorTaxId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="RIF del Vendedor" />
        <input type="number" value={taxableBaseGeneral} onChange={(e) => setTaxableBaseGeneral(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Base Imponible" />
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 18 }}>
          <input type="checkbox" checked={isNonDeductible} onChange={(e) => setIsNonDeductible(e.target.checked)} />
          Compra No Gravada o Sin Derecho a Credito Fiscal
        </label>

        <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginTop: 16 }}>Retencion de IVA (si aplica)</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={withholdingReceiptNumber} onChange={(e) => setWithholdingReceiptNumber(e.target.value)} style={inputStyle} placeholder="Nº Comprobante de Retencion" />
          <input type="number" value={withheldAmount} onChange={(e) => setWithheldAmount(e.target.value)} style={inputStyle} placeholder="Monto Retenido" />
        </div>

        <select value={apAccountId} onChange={(e) => setApAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 12 }}>
          <option value="">Cuenta de Cuentas por Pagar</option>
          {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="">Cuenta de Gasto</option>
          {accounts.filter(a => a.account_type === "EXPENSE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={vatCreditAccountId} onChange={(e) => setVatCreditAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="">Cuenta de IVA Credito Fiscal</option>
          {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>

        <button onClick={createEntry} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR COMPRA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Registros del Periodo</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 17, fontWeight: 700 }}>
                <th style={{ padding: 8 }}>Nº</th>
                <th style={{ padding: 8 }}>Fecha</th>
                <th style={{ padding: 8 }}>Factura</th>
                <th style={{ padding: 8 }}>Vendedor</th>
                <th style={{ padding: 8 }}>RIF</th>
                <th style={{ padding: 8, textAlign: "right" }}>Base Imponible</th>
                <th style={{ padding: 8, textAlign: "right" }}>Credito Fiscal</th>
                <th style={{ padding: 8, textAlign: "right" }}>Retenido</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.entry_number}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.entry_date}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.invoice_number}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.vendor_name}</td>
                  <td style={{ padding: 8, fontSize: 20 }}>{e.vendor_tax_id}</td>
                  <td style={{ padding: 8, textAlign: "right", fontSize: 20, ...theme.numberStyle }}>{e.taxable_base_general.toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", fontSize: 20, ...theme.numberStyle }}>{e.fiscal_credit.toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", fontSize: 20, ...theme.numberStyle }}>{e.withheld_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VerticalPageLayout>
  );
}
