"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const FREQUENCIES = ["MONTHLY", "WEEKLY", "QUARTERLY", "ANNUAL"];
const FREQUENCY_LABEL: Record<string, string> = { MONTHLY: "Mensual", WEEKLY: "Semanal", QUARTERLY: "Trimestral", ANNUAL: "Anual" };

function advanceDate(date: string, frequency: string): string {
  const d = new Date(date + "T00:00:00Z");
  if (frequency === "WEEKLY") d.setUTCDate(d.getUTCDate() + 7);
  else if (frequency === "QUARTERLY") d.setUTCMonth(d.getUTCMonth() + 3);
  else if (frequency === "ANNUAL") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export default function RecurringInvoicesPage() {
  const theme = getVerticalTheme("accounting");
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [arAccountId, setArAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");

  async function loadTemplates(cid: string) {
    const { data } = await supabase.from("recurring_invoice_templates").select("*, ar:ar_account_id(account_code, account_name), rev:revenue_account_id(account_code, account_name)").eq("company_id", cid).order("created_at", { ascending: false });
    setTemplates(data ?? []);
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
        await loadTemplates(cid);
      }
    }
    load();
  }, []);

  async function createTemplate() {
    setMessage("");
    if (!companyId || !customerName || !amount || !arAccountId || !revenueAccountId || !startDate) {
      setMessage("Completa cliente, monto, cuentas contables y fecha de inicio.");
      return;
    }
    const { error } = await supabase.from("recurring_invoice_templates").insert([{
      company_id: companyId,
      customer_name: customerName,
      description: description || null,
      amount: parseFloat(amount),
      ar_account_id: arAccountId,
      revenue_account_id: revenueAccountId,
      frequency,
      start_date: startDate,
      next_run_date: startDate,
      end_date: endDate || null,
    }]);
    if (error) { setMessage("Error al crear la plantilla: " + error.message); return; }
    setMessage("Plantilla creada. Generara su primera factura cuando llegue la fecha de inicio (" + startDate + ").");
    setCustomerName(""); setDescription(""); setAmount(""); setEndDate("");
    await loadTemplates(companyId);
  }

  async function toggleActive(tplId: string, isActive: boolean) {
    if (!companyId) return;
    await supabase.from("recurring_invoice_templates").update({ is_active: !isActive }).eq("id", tplId);
    await loadTemplates(companyId);
  }

  // Igual que la ruta de cron (app/api/cron/generate-recurring-invoices),
  // pero ejecutada por el usuario logueado bajo RLS normal en vez de con
  // service_role -- util para generar una factura vencida sin esperar a
  // la corrida automatica del dia, o si CRON_SECRET aun no esta
  // configurado en Vercel. Misma logica de avance de fecha.
  async function generateNow(tpl: any) {
    if (!companyId) return;
    if (!window.confirm("Se generara una factura de " + tpl.amount + " para " + tpl.customer_name + " con fecha de hoy. Confirmar?")) return;
    setGenerating(true);
    setMessage("");

    const today = new Date().toISOString().slice(0, 10);
    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Factura recurrente - " + tpl.customer_name + (tpl.description ? " (" + tpl.description + ")" : ""),
      entry_date: today,
      entry_number: nextNumber,
    }]).select("id").single();
    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); setGenerating(false); return; }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: tpl.ar_account_id, debit: tpl.amount, credit: 0 },
      { journal_entry_id: entry.id, account_id: tpl.revenue_account_id, debit: 0, credit: tpl.amount },
    ]);
    if (linesError) { setMessage("Error al guardar asiento: " + linesError.message); setGenerating(false); return; }

    const invoiceNumber = "REC-" + tpl.id.slice(0, 8) + "-" + today;
    const { data: invoice, error: invoiceError } = await supabase.from("ar_invoices").insert([{
      company_id: companyId,
      customer_name: tpl.customer_name,
      invoice_number: invoiceNumber,
      issue_date: today,
      due_date: today,
      amount: tpl.amount,
      journal_entry_id: entry.id,
    }]).select("id").single();
    if (invoiceError || !invoice) { setMessage("El asiento se creo, pero no se pudo crear la factura: " + invoiceError?.message); setGenerating(false); return; }

    const nextRunDate = advanceDate(tpl.next_run_date, tpl.frequency);
    await supabase.from("recurring_invoice_templates").update({ next_run_date: nextRunDate, last_generated_invoice_id: invoice.id, last_generated_at: new Date().toISOString() }).eq("id", tpl.id);

    setMessage("Factura " + invoiceNumber + " generada. Proxima fecha: " + nextRunDate + ".");
    setGenerating(false);
    await loadTemplates(companyId);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <VerticalPageLayout vertical="accounting" title="Facturacion Recurrente" subtitle="Plantillas para cargos periodicos fijos: se generan solas cada dia (cron) o a demanda" fullWidth>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} placeholder="Nombre del cliente" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Descripcion (ej: Suscripcion mensual plan Pro)" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Monto por ciclo" />
        <select value={arAccountId} onChange={(e) => setArAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta de Cuentas por Cobrar</option>
          {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={revenueAccountId} onChange={(e) => setRevenueAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta de Ingreso</option>
          {accounts.filter(a => a.account_type === "REVENUE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>)}
        </select>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} placeholder="Fin (opcional)" />
        </div>
        <button onClick={createTemplate} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          CREAR PLANTILLA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") || message.includes("error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {templates.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Plantillas</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Cliente</th>
                <th style={{ padding: 10 }}>Monto</th>
                <th style={{ padding: 10 }}>Frecuencia</th>
                <th style={{ padding: 10 }}>Proxima Factura</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => {
                const isDue = tpl.is_active && tpl.next_run_date <= today;
                return (
                  <tr key={tpl.id} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 20 }}>{tpl.customer_name}{tpl.description ? <span style={{ color: "#8B93A7", fontSize: 14 }}> — {tpl.description}</span> : null}</td>
                    <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{tpl.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10, fontSize: 18 }}>{FREQUENCY_LABEL[tpl.frequency] ?? tpl.frequency}</td>
                    <td style={{ padding: 10, fontSize: 18, color: isDue ? "#facc15" : "white", fontWeight: isDue ? 700 : 400 }}>{tpl.next_run_date}{isDue ? " (vencida)" : ""}</td>
                    <td style={{ padding: 10, fontSize: 18, color: tpl.is_active ? "#4ade80" : "#8B93A7" }}>{tpl.is_active ? "Activa" : "Pausada"}</td>
                    <td style={{ padding: 10 }}>
                      {isDue && (
                        <button onClick={() => generateNow(tpl)} disabled={generating} style={{ background: "none", border: "1px solid #60a5fa", color: "#60a5fa", padding: "6px 14px", borderRadius: 8, fontSize: 14, marginRight: 6, opacity: generating ? 0.6 : 1 }}>
                          Generar Ahora
                        </button>
                      )}
                      <button onClick={() => toggleActive(tpl.id, tpl.is_active)} style={{ background: "none", border: "1px solid #8B93A7", color: "#8B93A7", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
                        {tpl.is_active ? "Pausar" : "Reactivar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </VerticalPageLayout>
  );
}
