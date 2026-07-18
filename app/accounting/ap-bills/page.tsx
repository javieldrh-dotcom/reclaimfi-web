"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function ApBillsPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [apAccountId, setApAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  async function loadBills(cid: string) {
    const { data } = await supabase.from("ap_bills").select("*").eq("company_id", cid).order("issue_date", { ascending: false });
    setBills(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["LIABILITY", "EXPENSE"]);
        setAccounts(acc ?? []);
        await loadBills(cid);
      }
    }
    load();
  }, []);

  async function createBill() {
    setMessage("");
    if (!companyId || !vendorName || !billNumber || !amount || !apAccountId || !expenseAccountId) {
      setMessage("Completa todos los campos, incluyendo las cuentas contables.");
      return;
    }

    const amt = parseFloat(amount);

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Factura Proveedor " + billNumber + " - " + vendorName,
      entry_date: issueDate,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: expenseAccountId, debit: amt, credit: 0 },
      { journal_entry_id: entry.id, account_id: apAccountId, debit: 0, credit: amt },
    ]);

    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); return; }

    const { error: billError } = await supabase.from("ap_bills").insert([{
      company_id: companyId,
      vendor_name: vendorName,
      bill_number: billNumber,
      issue_date: issueDate,
      due_date: dueDate || issueDate,
      amount: amt,
      journal_entry_id: entry.id,
    }]);

    if (billError) { setMessage("Error al guardar factura: " + billError.message); return; }

    setMessage("Factura de proveedor creada y asiento contable generado automaticamente.");
    setVendorName(""); setBillNumber(""); setAmount(""); setDueDate("");
    await loadBills(companyId);
  }

  async function markAsPaid(billId: string) {
    await supabase.from("ap_bills").update({ status: "PAID" }).eq("id", billId);
    if (companyId) await loadBills(companyId);
  }

  async function voidBill(billId: string, journalEntryId: string | null) {
    const reason = window.prompt("Motivo de la anulacion:");
    if (!reason) return;
    await supabase.from("ap_bills").update({ status: "VOIDED" }).eq("id", billId);
    if (journalEntryId) {
      await supabase.from("journal_entries").update({ status: "VOIDED", voided_at: new Date().toISOString(), void_reason: reason }).eq("id", journalEntryId);
    }
    if (companyId) await loadBills(companyId);
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Cuentas por Pagar" subtitle="Cada factura de proveedor genera automaticamente su asiento contable en el Libro Diario" fullWidth>
      <div style={{ maxWidth: 600 }}>
        <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} style={inputStyle} placeholder="Nombre del proveedor" />
        <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Numero de factura" />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={inputStyle} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} placeholder="Vencimiento" />
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Monto" />
        <select value={apAccountId} onChange={(e) => setApAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta de Cuentas por Pagar</option>
          {accounts.filter(a => a.account_type === "LIABILITY").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta de Gasto</option>
          {accounts.filter(a => a.account_type === "EXPENSE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <button onClick={createBill} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          CREAR FACTURA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {bills.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Facturas de Proveedores</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Factura</th>
                <th style={{ padding: 10 }}>Proveedor</th>
                <th style={{ padding: 10 }}>Vencimiento</th>
                <th style={{ padding: 10 }}>Monto</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.bill_number}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.vendor_name}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.due_date}</td>
                  <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{b.amount.toLocaleString()}</td>
                  <td style={{ padding: 10, fontSize: 20, color: b.status === "PAID" ? "#4ade80" : "#facc15" }}>{b.status}</td>
                  <td style={{ padding: 10 }}>
                    {b.status === "PENDING" && (
                      <>
                        <button onClick={() => markAsPaid(b.id)} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "6px 14px", borderRadius: 8, fontSize: 15, marginRight: 6 }}>
                          Marcar Pagada
                        </button>
                        <button onClick={() => voidBill(b.id, b.journal_entry_id)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "6px 14px", borderRadius: 8, fontSize: 15 }}>
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
