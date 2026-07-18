"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function ArInvoicesPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [arAccountId, setArAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  async function loadInvoices(cid: string) {
    const { data } = await supabase.from("ar_invoices").select("*").eq("company_id", cid).order("issue_date", { ascending: false });
    setInvoices(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "REVENUE"]);
        setAccounts(acc ?? []);
        await loadInvoices(cid);
      }
    }
    load();
  }, []);

  async function createInvoice() {
    setMessage("");
    if (!companyId || !customerName || !invoiceNumber || !amount || !arAccountId || !revenueAccountId) {
      setMessage("Completa todos los campos, incluyendo las cuentas contables.");
      return;
    }

    const amt = parseFloat(amount);

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Factura " + invoiceNumber + " - " + customerName,
      entry_date: issueDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: arAccountId, debit: amt, credit: 0 },
      { journal_entry_id: entry.id, account_id: revenueAccountId, debit: 0, credit: amt },
    ]);

    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); return; }

    const { error: invoiceError } = await supabase.from("ar_invoices").insert([{
      company_id: companyId,
      customer_name: customerName,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate || issueDate,
      amount: amt,
      journal_entry_id: entry.id,
    }]);

    if (invoiceError) { setMessage("Error al guardar factura: " + invoiceError.message); return; }

    setMessage("Factura creada y asiento contable generado automaticamente.");
    setCustomerName(""); setInvoiceNumber(""); setAmount(""); setDueDate("");
    await loadInvoices(companyId);
  }

  async function markAsPaid(invoiceId: string) {
    await supabase.from("ar_invoices").update({ status: "PAID" }).eq("id", invoiceId);
    if (companyId) await loadInvoices(companyId);
  }

  async function voidInvoice(invoiceId: string, journalEntryId: string | null) {
    const reason = window.prompt("Motivo de la anulacion:");
    if (!reason) return;
    await supabase.from("ar_invoices").update({ status: "VOIDED" }).eq("id", invoiceId);
    if (journalEntryId) {
      await supabase.from("journal_entries").update({ status: "VOIDED", voided_at: new Date().toISOString(), void_reason: reason }).eq("id", journalEntryId);
    }
    if (companyId) await loadInvoices(companyId);
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Cuentas por Cobrar" subtitle="Cada factura genera automaticamente su asiento contable en el Libro Diario" fullWidth>
      <div style={{ maxWidth: 600 }}>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} placeholder="Nombre del cliente" />
        <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Numero de factura" />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={inputStyle} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} placeholder="Vencimiento" />
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Monto" />
        <select value={arAccountId} onChange={(e) => setArAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta de Cuentas por Cobrar</option>
          {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={revenueAccountId} onChange={(e) => setRevenueAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta de Ingreso</option>
          {accounts.filter(a => a.account_type === "REVENUE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <button onClick={createInvoice} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          CREAR FACTURA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {invoices.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Facturas Emitidas</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Factura</th>
                <th style={{ padding: 10 }}>Cliente</th>
                <th style={{ padding: 10 }}>Vencimiento</th>
                <th style={{ padding: 10 }}>Monto</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: 10, fontSize: 20 }}>{inv.invoice_number}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{inv.customer_name}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{inv.due_date}</td>
                  <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{inv.amount.toLocaleString()}</td>
                  <td style={{ padding: 10, fontSize: 20, color: inv.status === "PAID" ? "#4ade80" : "#facc15" }}>{inv.status}</td>
                  <td style={{ padding: 10 }}>
                    {inv.status === "PENDING" && (
                      <>
                        <button onClick={() => markAsPaid(inv.id)} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "6px 14px", borderRadius: 8, fontSize: 15, marginRight: 6 }}>
                          Marcar Pagada
                        </button>
                        <button onClick={() => voidInvoice(inv.id, inv.journal_entry_id)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "6px 14px", borderRadius: 8, fontSize: 15 }}>
                          Anular
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VerticalPageLayout>
  );
}
