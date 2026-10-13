"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function ArInvoicesPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [functionalCurrency, setFunctionalCurrency] = useState("USD");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [arAccountId, setArAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Panel de cobro: que factura esta "abierta" para cobrar, con que
  // cuenta de caja/banco, y si el cobro (manual o PayPal) esta en curso.
  const [collectingInvoiceId, setCollectingInvoiceId] = useState<string | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [collectMessage, setCollectMessage] = useState("");

  async function loadInvoices(cid: string) {
    const { data } = await supabase.from("ar_invoices").select("*").eq("company_id", cid).order("issue_date", { ascending: false });
    setInvoices(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: company } = await supabase.from("companies").select("functional_currency").eq("id", cid).single();
        setFunctionalCurrency(company?.functional_currency ?? "USD");
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

    // Mismo patron que purchase-book/sales-book: si no se asigna el numero
    // aqui queda NULL, y dos facturas podrian terminar con el mismo numero
    // (o sin numero) si algo mas en la base de datos tambien lo calcula.
    const { data: lastJournalEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const journalNextNumber = (lastJournalEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Factura " + invoiceNumber + " - " + customerName,
      entry_date: issueDate,
      entry_number: journalNextNumber,
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

  function openCollectPanel(invoiceId: string) {
    setCollectingInvoiceId(collectingInvoiceId === invoiceId ? null : invoiceId);
    setPaymentAccountId("");
    setCollectMessage("");
  }

  // Cobro manual: a diferencia del markAsPaid() anterior (que solo cambiaba
  // el status), esto genera el asiento contable real del cobro -- debito a
  // la cuenta de caja/banco elegida, credito a la MISMA cuenta de Cuentas
  // por Cobrar que se uso al crear la factura (se obtiene del asiento
  // original, no se asume). Sin este asiento, el saldo de CxC en el Libro
  // Mayor nunca bajaba aunque la factura se marcara "Pagada".
  async function recordManualPayment(invoice: any) {
    if (!companyId || !paymentAccountId) {
      setCollectMessage("Selecciona la cuenta de caja/banco que recibio el pago.");
      return;
    }
    if (!window.confirm("Se registrara el cobro de " + invoice.amount + " de " + invoice.customer_name + " con su asiento contable. Confirmar?")) return;

    setCollecting(true);
    setCollectMessage("");

    const { data: originalLines } = await supabase.from("journal_lines").select("account_id, debit").eq("journal_entry_id", invoice.journal_entry_id).gt("debit", 0);
    const arAccountIdOriginal = originalLines?.[0]?.account_id;
    if (!arAccountIdOriginal) { setCollectMessage("No se pudo determinar la cuenta de Cuentas por Cobrar original de esta factura."); setCollecting(false); return; }

    const today = new Date().toISOString().slice(0, 10);
    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Cobro manual - Factura " + invoice.invoice_number + " - " + invoice.customer_name,
      entry_date: today,
      entry_number: nextNumber,
    }]).select("id").single();
    if (entryError || !entry) { setCollectMessage("Error al crear asiento: " + entryError?.message); setCollecting(false); return; }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: paymentAccountId, debit: invoice.amount, credit: 0 },
      { journal_entry_id: entry.id, account_id: arAccountIdOriginal, debit: 0, credit: invoice.amount },
    ]);
    if (linesError) { setCollectMessage("Error al guardar asiento: " + linesError.message); setCollecting(false); return; }

    const { error: updateError } = await supabase.from("ar_invoices").update({
      status: "PAID",
      paid_amount: invoice.amount,
      paid_at: new Date().toISOString(),
      payment_method: "MANUAL",
      payment_account_id: paymentAccountId,
    }).eq("id", invoice.id);
    if (updateError) { setCollectMessage("El asiento se creo (Nº" + nextNumber + ") pero no se pudo actualizar la factura: " + updateError.message); setCollecting(false); return; }

    setCollectMessage("Cobro registrado con asiento Nº" + nextNumber + ".");
    setCollecting(false);
    setCollectingInvoiceId(null);
    await loadInvoices(companyId);
  }

  // Renderiza el boton de PayPal (orden unica de pago, no suscripcion) para
  // la factura que este abierta en el panel de cobro. Solo aplica si la
  // empresa factura en USD -- PayPal no liquida en VES, asi que ofrecer el
  // boton con otra moneda funcional seria un flujo que siempre falla.
  useEffect(() => {
    if (!collectingInvoiceId || functionalCurrency !== "USD" || !paymentAccountId) return;
    const invoice = invoices.find((i) => i.id === collectingInvoiceId);
    if (!invoice) return;

    const containerId = "paypal-ar-" + collectingInvoiceId;

    function renderButtons() {
      const container = document.getElementById(containerId);
      if (!container || !window.paypal) return;
      container.innerHTML = "";
      window.paypal.Buttons({
        createOrder: (_: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{ amount: { value: invoice.amount.toFixed(2), currency_code: "USD" }, description: "Factura " + invoice.invoice_number }],
          });
        },
        onApprove: async (approveData: any, actions: any) => {
          await actions.order.capture();
          setCollecting(true);
          setCollectMessage("Verificando el pago con PayPal...");
          try {
            const res = await fetch("/api/ar-invoices/paypal-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ invoiceId: invoice.id, paypalOrderId: approveData.orderID, paymentAccountId }),
            });
            const data = await res.json();
            if (data.success) {
              setCollectMessage(data.message);
              setCollectingInvoiceId(null);
              if (companyId) await loadInvoices(companyId);
            } else {
              setCollectMessage("Error: " + data.error);
            }
          } catch (err: any) {
            setCollectMessage("Error al confirmar el pago: " + err.message);
          }
          setCollecting(false);
        },
        onError: (err: any) => {
          setCollectMessage("Error de PayPal: " + (err?.message ?? "desconocido"));
        },
      }).render("#" + containerId);
    }

    const existingScript = document.getElementById("paypal-sdk-script-orders");
    if (existingScript && window.paypal) {
      renderButtons();
      return;
    }
    if (existingScript) {
      existingScript.addEventListener("load", renderButtons);
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk-script-orders";
    // Mismo client-id publico ya usado en app/subscribe/page.tsx, pero con
    // intent=capture (orden de pago unico) en vez de intent=subscription.
    script.src = "https://www.paypal.com/sdk/js?client-id=BAA14BzB_9VhviO_C0gWpUwrrpSkF4AMRkzz-wI1E0_VGAEawrXQ-09k-jOguRdCZZzifZFfD41n2B97V4&currency=USD&intent=capture";
    script.onload = renderButtons;
    document.body.appendChild(script);
  }, [collectingInvoiceId, paymentAccountId, functionalCurrency, invoices, companyId]);

  async function reverseInvoice(invoiceId: string, journalEntryId: string | null, customerNameLocal: string) {
    if (!companyId || !journalEntryId) return;
    const { data: checkEntry } = await supabase.from("journal_entries").select("reversed_by_entry_id").eq("id", journalEntryId).single();
    if (checkEntry?.reversed_by_entry_id) {
      // El asiento ya fue reversado, pero probablemente desde el Diario
      // directamente (no desde este boton), por lo que la factura se quedo
      // sin actualizar. Se sincroniza el estado aqui en vez de dejarla
      // huerfana en "PENDING" con un asiento que ya no existe contablemente.
      // La columna status de ar_invoices tiene una restriccion (CHECK) que solo
      // permite PENDING/PAID/OVERDUE/VOIDED - "REVERSED" no es un valor valido.
      // Se usa VOIDED (anulada), que ya existe en el esquema para este mismo caso.
      const { error: syncError } = await supabase.from("ar_invoices").update({ status: "VOIDED" }).eq("id", invoiceId);
      if (syncError) {
        alert("El asiento ya estaba reversado, pero no se pudo actualizar el estado de la factura. Error de la base de datos: " + syncError.message);
      } else {
        alert("Este asiento ya habia sido reversado anteriormente (probablemente desde el Diario). Se actualizo el estado de la factura a VOIDED (Anulada) para que coincida.");
      }
      if (companyId) await loadInvoices(companyId);
      return;
    }
    if (!window.confirm("Se creara un asiento contable de reverso (cifras invertidas). El registro original permanecera intacto. Confirmar?")) return;
    const { data: origEntry } = await supabase.from("journal_entries").select("entry_number, description").eq("id", journalEntryId).single();
    const { data: origLines } = await supabase.from("journal_lines").select("account_id, debit, credit").eq("journal_entry_id", journalEntryId);
    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const { data: newEntry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Reverso del Asiento Nº" + (origEntry?.entry_number ?? "S/N") + " - " + (origEntry?.description ?? customerNameLocal),
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
    // Sin esto la factura se queda en "PENDING" para siempre: se puede
    // marcar "Pagada" despues de haber sido reversada, aunque el asiento
    // contable ya no exista (quedo anulado por el reverso).
    const { error: statusSyncError } = await supabase.from("ar_invoices").update({ status: "VOIDED" }).eq("id", invoiceId);
    if (statusSyncError) {
      alert("El asiento de reverso se creo (Nº" + nextNumber + "), pero no se pudo actualizar el estado de la factura. Error de la base de datos: " + statusSyncError.message);
    } else {
      alert("Reverso creado correctamente (Asiento Nº" + nextNumber + ").");
    }
    if (companyId) await loadInvoices(companyId);
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Cuentas por Cobrar" subtitle="Cada factura genera automaticamente su asiento contable en el Libro Diario" fullWidth>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
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
              {invoices.slice(0, displayLimit).map((inv) => (
                <>
                  <tr key={inv.id} style={{ borderBottom: collectingInvoiceId === inv.id ? "none" : "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 20 }}>{inv.invoice_number}</td>
                    <td style={{ padding: 10, fontSize: 20 }}>{inv.customer_name}</td>
                    <td style={{ padding: 10, fontSize: 20 }}>{inv.due_date}</td>
                    <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10, fontSize: 20, color: inv.status === "PAID" ? "#4ade80" : inv.status === "VOIDED" ? "#FB923C" : "#facc15" }}>{inv.status}</td>
                    <td style={{ padding: 10 }}>
                      {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                        <>
                          <button onClick={() => openCollectPanel(inv.id)} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "6px 14px", borderRadius: 8, fontSize: 15, marginRight: 6 }}>
                            {collectingInvoiceId === inv.id ? "Cerrar" : "Cobrar"}
                          </button>
                          <button onClick={() => reverseInvoice(inv.id, inv.journal_entry_id, inv.customer_name)} style={{ background: "none", border: "1px solid #FB923C", color: "#FB923C", padding: "6px 14px", borderRadius: 8, fontSize: 15 }}>
                            Reversar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  {collectingInvoiceId === inv.id && (
                    <tr style={{ borderBottom: "1px solid #1F2937" }}>
                      <td colSpan={6} style={{ padding: "0 10px 20px 10px" }}>
                        <div style={{ background: "#11161F", border: "1px solid #1F2937", borderRadius: 10, padding: 16, maxWidth: 480 }}>
                          <p style={{ fontSize: 14, color: "#8B93A7", marginBottom: 8 }}>Cuenta de caja/banco que recibe el pago:</p>
                          <select value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)} style={{ ...theme.inputStyle, fontSize: 16, width: "100%" }}>
                            <option value="">Selecciona la cuenta</option>
                            {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                          </select>
                          <button onClick={() => recordManualPayment(inv)} disabled={collecting || !paymentAccountId} style={{ marginTop: 10, background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "8px 16px", borderRadius: 8, fontSize: 15, opacity: (collecting || !paymentAccountId) ? 0.5 : 1 }}>
                            Confirmar Cobro Manual
                          </button>
                          {functionalCurrency === "USD" && paymentAccountId && (
                            <div style={{ marginTop: 14 }}>
                              <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 8 }}>O que el cliente pague en linea:</p>
                              <div id={"paypal-ar-" + inv.id}></div>
                            </div>
                          )}
                          {functionalCurrency !== "USD" && (
                            <p style={{ marginTop: 10, fontSize: 13, color: "#8B93A7" }}>Cobro en linea via PayPal no disponible: esta empresa factura en {functionalCurrency}, y PayPal no liquida en esa moneda.</p>
                          )}
                          {collectMessage && <p style={{ marginTop: 10, fontSize: 14, color: collectMessage.startsWith("Error") ? "#f87171" : theme.accent }}>{collectMessage}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {invoices.length > displayLimit && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => setDisplayLimit(displayLimit + 50)} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "10px 24px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
                Cargar 50 mas (mostrando {displayLimit} de {invoices.length})
              </button>
            </div>
          )}
        </div>
      )}
    </VerticalPageLayout>
  );
}
