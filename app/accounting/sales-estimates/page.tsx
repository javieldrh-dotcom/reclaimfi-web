"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
  CONVERTED: "Convertida a Factura",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#8B93A7",
  SENT: "#facc15",
  ACCEPTED: "#4ade80",
  REJECTED: "#f87171",
  EXPIRED: "#FB923C",
  CONVERTED: "#60a5fa",
};

export default function SalesEstimatesPage() {
  const theme = getVerticalTheme("accounting");
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [arAccountId, setArAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [estimateNumber, setEstimateNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [converting, setConverting] = useState<string | null>(null);

  async function loadEstimates(cid: string) {
    const { data } = await supabase.from("sales_estimates").select("*").eq("company_id", cid).order("issue_date", { ascending: false });
    setEstimates(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).eq("is_active", true).in("account_type", ["ASSET", "REVENUE"]);
        setAccounts(acc ?? []);
        await loadEstimates(cid);
      }
    }
    load();
  }, []);

  async function createEstimate() {
    setMessage("");
    if (!companyId || !customerName || !estimateNumber || !amount) {
      setMessage("Completa cliente, numero de cotizacion y monto.");
      return;
    }
    const { error } = await supabase.from("sales_estimates").insert([{
      company_id: companyId,
      customer_name: customerName,
      estimate_number: estimateNumber,
      issue_date: issueDate,
      expiry_date: expiryDate || null,
      amount: parseFloat(amount),
      notes: notes || null,
    }]);
    if (error) { setMessage("Error al crear la cotizacion: " + error.message); return; }
    setMessage("Cotizacion creada en borrador.");
    setCustomerName(""); setEstimateNumber(""); setExpiryDate(""); setAmount(""); setNotes("");
    await loadEstimates(companyId);
  }

  async function setStatus(estimateId: string, status: string) {
    if (!companyId) return;
    await supabase.from("sales_estimates").update({ status }).eq("id", estimateId);
    await loadEstimates(companyId);
  }

  // Convertir una cotizacion aceptada en una factura real de Cuentas por
  // Cobrar: crea el asiento contable (mismo patron que ar-invoices/page.tsx
  // createInvoice) y la fila en ar_invoices, y enlaza la cotizacion a esa
  // factura via converted_invoice_id para que quede trazable el origen de
  // cada factura (requisito de auditoria: de donde vino este ingreso).
  async function convertToInvoice(est: any) {
    if (!companyId) return;
    if (!arAccountId || !revenueAccountId) {
      setMessage("Selecciona primero la Cuenta por Cobrar y la Cuenta de Ingreso (arriba) antes de convertir una cotizacion.");
      return;
    }
    if (!window.confirm("Se creara una factura de Cuentas por Cobrar por " + est.amount + " a nombre de " + est.customer_name + ", con su asiento contable. Confirmar?")) return;

    setConverting(est.id);
    setMessage("");

    const { data: lastJournalEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const journalNextNumber = (lastJournalEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Factura (desde Cotizacion " + est.estimate_number + ") - " + est.customer_name,
      entry_date: new Date().toISOString().slice(0, 10),
      entry_number: journalNextNumber,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); setConverting(null); return; }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: arAccountId, debit: est.amount, credit: 0 },
      { journal_entry_id: entry.id, account_id: revenueAccountId, debit: 0, credit: est.amount },
    ]);
    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); setConverting(null); return; }

    const invoiceNumber = "EST-" + est.estimate_number;
    const { data: invoice, error: invoiceError } = await supabase.from("ar_invoices").insert([{
      company_id: companyId,
      customer_name: est.customer_name,
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: est.expiry_date || new Date().toISOString().slice(0, 10),
      amount: est.amount,
      journal_entry_id: entry.id,
    }]).select("id").single();

    if (invoiceError || !invoice) { setMessage("El asiento se creo, pero no se pudo crear la factura: " + invoiceError?.message); setConverting(null); return; }

    const { error: updateError } = await supabase.from("sales_estimates").update({ status: "CONVERTED", converted_invoice_id: invoice.id }).eq("id", est.id);
    if (updateError) { setMessage("La factura " + invoiceNumber + " se creo, pero no se pudo marcar la cotizacion como convertida: " + updateError.message); }
    else { setMessage("Cotizacion convertida. Factura " + invoiceNumber + " creada en Cuentas por Cobrar."); }

    setConverting(null);
    await loadEstimates(companyId);
  }

  return (
    <VerticalPageLayout vertical="accounting" title="Cotizaciones de Venta" subtitle="Prepara presupuestos para clientes y conviertelos en factura solo cuando sean aceptados" fullWidth>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} placeholder="Nombre del cliente" />
        <input value={estimateNumber} onChange={(e) => setEstimateNumber(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Numero de cotizacion" />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={inputStyle} />
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={inputStyle} placeholder="Vence" />
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Monto" />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Notas (opcional)" />
        <button onClick={createEstimate} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          CREAR COTIZACION
        </button>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1F2937" }}>
          <p style={{ fontSize: 14, color: "#8B93A7", marginBottom: 10 }}>Cuentas contables para convertir cotizaciones aceptadas en factura:</p>
          <select value={arAccountId} onChange={(e) => setArAccountId(e.target.value)} style={inputStyle}>
            <option value="">Cuenta de Cuentas por Cobrar</option>
            {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <select value={revenueAccountId} onChange={(e) => setRevenueAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
            <option value="">Cuenta de Ingreso</option>
            {accounts.filter(a => a.account_type === "REVENUE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
        </div>

        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") || message.includes("error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {estimates.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Cotizaciones</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Cotizacion</th>
                <th style={{ padding: 10 }}>Cliente</th>
                <th style={{ padding: 10 }}>Vence</th>
                <th style={{ padding: 10 }}>Monto</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {estimates.slice(0, displayLimit).map((est) => (
                <tr key={est.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: 10, fontSize: 20 }}>{est.estimate_number}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{est.customer_name}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{est.expiry_date ?? "—"}</td>
                  <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{est.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: 10, fontSize: 18, color: STATUS_COLOR[est.status] ?? "white", fontWeight: 700 }}>{STATUS_LABEL[est.status] ?? est.status}</td>
                  <td style={{ padding: 10 }}>
                    {STATUS_FLOW[est.status]?.map((next) => (
                      <button key={next} onClick={() => setStatus(est.id, next)} style={{ background: "none", border: "1px solid " + (STATUS_COLOR[next] ?? "#8B93A7"), color: STATUS_COLOR[next] ?? "#8B93A7", padding: "6px 14px", borderRadius: 8, fontSize: 14, marginRight: 6 }}>
                        {next === "SENT" ? "Marcar Enviada" : next === "ACCEPTED" ? "Marcar Aceptada" : "Marcar Rechazada"}
                      </button>
                    ))}
                    {est.status === "ACCEPTED" && (
                      <button onClick={() => convertToInvoice(est)} disabled={converting === est.id} style={{ background: "none", border: "1px solid #60a5fa", color: "#60a5fa", padding: "6px 14px", borderRadius: 8, fontSize: 14, opacity: converting === est.id ? 0.6 : 1 }}>
                        {converting === est.id ? "Convirtiendo..." : "Convertir a Factura"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {estimates.length > displayLimit && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => setDisplayLimit(displayLimit + 50)} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "10px 24px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
                Cargar 50 mas (mostrando {displayLimit} de {estimates.length})
              </button>
            </div>
          )}
        </div>
      )}
    </VerticalPageLayout>
  );
}
