"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

// Cobranza de Cuentas por Cobrar (AR collections / dunning). Esta pantalla
// NO envia nada automaticamente -- este proyecto no tiene ningun proveedor
// de email/SMS configurado (se reviso antes de construir esto, para no
// repetir el mismo problema de Binance Pay: una integracion automatica que
// termina bloqueada porque falta una credencial externa que Javiel no
// tiene a mano). En su lugar:
//   1) Clasifica las facturas pendientes/vencidas por antiguedad (aging),
//      que es la base real de cualquier gestion de cobranza.
//   2) Genera el TEXTO de un aviso de cobro listo para copiar y enviar
//      manualmente (WhatsApp, email, lo que uses).
//   3) Lleva una bitacora (ar_collection_activity) de que gestion se hizo
//      y cuando, para no perder el hilo de a quien ya se le escribio.
// El status "OVERDUE" se asigna automaticamente via cron (ver
// app/api/cron/mark-overdue-invoices) cuando la fecha de vencimiento ya
// paso; esta pantalla solo lee ese estado, no lo calcula por su cuenta,
// para que coincida siempre con lo que el resto del sistema ve.

type Bucket = "AL_DIA" | "D1_30" | "D31_60" | "D61_90" | "D90_MAS";

const BUCKET_LABELS: Record<Bucket, string> = {
  AL_DIA: "Al dia (no vencida)",
  D1_30: "1 - 30 dias",
  D31_60: "31 - 60 dias",
  D61_90: "61 - 90 dias",
  D90_MAS: "Mas de 90 dias",
};

const BUCKET_COLORS: Record<Bucket, string> = {
  AL_DIA: "#4ade80",
  D1_30: "#facc15",
  D31_60: "#FB923C",
  D61_90: "#f87171",
  D90_MAS: "#dc2626",
};

function daysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function bucketFor(days: number): Bucket {
  if (days <= 0) return "AL_DIA";
  if (days <= 30) return "D1_30";
  if (days <= 60) return "D31_60";
  if (days <= 90) return "D61_90";
  return "D90_MAS";
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  REMINDER_SENT: "Recordatorio enviado",
  CALL: "Llamada telefonica",
  PROMISE_TO_PAY: "Promesa de pago",
  NOTE: "Nota",
};

export default function ArCollectionsPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [functionalCurrency, setFunctionalCurrency] = useState("USD");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bucketFilter, setBucketFilter] = useState<Bucket | "ALL">("ALL");

  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [noticeText, setNoticeText] = useState("");
  const [newActivityType, setNewActivityType] = useState("REMINDER_SENT");
  const [newActivityNotes, setNewActivityNotes] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [panelMessage, setPanelMessage] = useState("");

  async function loadInvoices(cid: string) {
    const { data } = await supabase
      .from("ar_invoices")
      .select("*")
      .eq("company_id", cid)
      .in("status", ["PENDING", "OVERDUE"])
      .order("due_date", { ascending: true });
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
        const { data: company } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
        setCompanyName(company?.name ?? "");
        setFunctionalCurrency(company?.functional_currency ?? "USD");
        await loadInvoices(cid);
      }
    }
    load();
  }, []);

  async function openPanel(invoiceId: string) {
    if (openInvoiceId === invoiceId) { setOpenInvoiceId(null); return; }
    setOpenInvoiceId(invoiceId);
    setPanelMessage("");
    setNewActivityNotes("");
    setNewActivityType("REMINDER_SENT");

    const invoice = invoices.find((i) => i.id === invoiceId);
    if (invoice) {
      const days = daysOverdue(invoice.due_date);
      setNoticeText(
        "Estimado(a) " + invoice.customer_name + ",\n\n" +
        "Le escribimos para recordarle que la factura N° " + invoice.invoice_number +
        " por un monto de " + invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + functionalCurrency +
        ", con fecha de vencimiento " + invoice.due_date +
        (days > 0 ? ", se encuentra pendiente de pago desde hace " + days + " dia" + (days === 1 ? "" : "s") + "." : ", vence el " + invoice.due_date + ".") + "\n\n" +
        "Le agradecemos regularizar esta deuda a la brevedad posible. Si ya realizó el pago, por favor ignore este mensaje y notifíquenos para actualizar nuestros registros.\n\n" +
        "Quedamos atentos a cualquier consulta.\n\n" +
        "Saludos cordiales,\n" + (companyName || "Nuestra empresa")
      );
    }

    setLoadingActivities(true);
    const { data } = await supabase
      .from("ar_collection_activity")
      .select("*")
      .eq("ar_invoice_id", invoiceId)
      .order("created_at", { ascending: false });
    setActivities(data ?? []);
    setLoadingActivities(false);
  }

  async function copyNotice() {
    try {
      await navigator.clipboard.writeText(noticeText);
      setPanelMessage("Aviso copiado al portapapeles.");
    } catch {
      setPanelMessage("No se pudo copiar automaticamente. Selecciona el texto y copialo manualmente.");
    }
  }

  async function saveActivity(invoiceId: string) {
    if (!companyId) return;
    setSavingActivity(true);
    setPanelMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("ar_collection_activity").insert([{
      company_id: companyId,
      ar_invoice_id: invoiceId,
      activity_type: newActivityType,
      notes: newActivityNotes || null,
      created_by: userData?.user?.id ?? null,
    }]);
    if (error) {
      setPanelMessage("Error al registrar la gestion: " + error.message);
      setSavingActivity(false);
      return;
    }
    const { data } = await supabase
      .from("ar_collection_activity")
      .select("*")
      .eq("ar_invoice_id", invoiceId)
      .order("created_at", { ascending: false });
    setActivities(data ?? []);
    setNewActivityNotes("");
    setPanelMessage("Gestion registrada.");
    setSavingActivity(false);
  }

  const enriched = invoices.map((inv) => {
    const days = daysOverdue(inv.due_date);
    return { ...inv, days, bucket: bucketFor(days) };
  });

  const buckets: Bucket[] = ["AL_DIA", "D1_30", "D31_60", "D61_90", "D90_MAS"];
  const bucketTotals: Record<Bucket, number> = { AL_DIA: 0, D1_30: 0, D31_60: 0, D61_90: 0, D90_MAS: 0 };
  enriched.forEach((inv) => { bucketTotals[inv.bucket as Bucket] += inv.amount; });
  const grandTotal = Object.values(bucketTotals).reduce((a, b) => a + b, 0);

  const filtered = bucketFilter === "ALL" ? enriched : enriched.filter((inv) => inv.bucket === bucketFilter);

  return (
    <VerticalPageLayout vertical="accounting" title="Cobranza (Aging de Cuentas por Cobrar)" subtitle="Antiguedad de saldos, avisos de cobro y bitacora de gestion -- las facturas vencidas se marcan automaticamente cada dia" fullWidth>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div
            onClick={() => setBucketFilter("ALL")}
            style={{ ...theme.cardStyle, cursor: "pointer", border: bucketFilter === "ALL" ? "2px solid " + theme.accent : theme.cardStyle.border, padding: 16 }}
          >
            <p style={{ fontSize: 13, color: "#8B93A7" }}>TOTAL PENDIENTE</p>
            <p style={{ ...theme.numberStyle, fontSize: 22, marginTop: 6 }}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>{enriched.length} factura{enriched.length === 1 ? "" : "s"}</p>
          </div>
          {buckets.map((b) => {
            const count = enriched.filter((i) => i.bucket === b).length;
            return (
              <div
                key={b}
                onClick={() => setBucketFilter(b)}
                style={{ ...theme.cardStyle, cursor: "pointer", border: bucketFilter === b ? "2px solid " + BUCKET_COLORS[b] : theme.cardStyle.border, padding: 16 }}
              >
                <p style={{ fontSize: 13, color: BUCKET_COLORS[b], fontWeight: 700 }}>{BUCKET_LABELS[b]}</p>
                <p style={{ ...theme.numberStyle, fontSize: 22, marginTop: 6 }}>{bucketTotals[b].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>{count} factura{count === 1 ? "" : "s"}</p>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p style={{ marginTop: 40, color: "#8B93A7", fontSize: 16, textAlign: "center" }}>
            {invoices.length === 0 ? "No hay facturas pendientes o vencidas. Buen trabajo." : "No hay facturas en este rango de antiguedad."}
          </p>
        )}

        {filtered.length > 0 && (
          <table style={{ width: "100%", marginTop: 32, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 15, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Factura</th>
                <th style={{ padding: 10 }}>Cliente</th>
                <th style={{ padding: 10 }}>Vencimiento</th>
                <th style={{ padding: 10 }}>Dias Vencida</th>
                <th style={{ padding: 10 }}>Monto</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <>
                  <tr key={inv.id} style={{ borderBottom: openInvoiceId === inv.id ? "none" : "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 18 }}>{inv.invoice_number}</td>
                    <td style={{ padding: 10, fontSize: 18 }}>{inv.customer_name}</td>
                    <td style={{ padding: 10, fontSize: 18 }}>{inv.due_date}</td>
                    <td style={{ padding: 10, fontSize: 18, color: BUCKET_COLORS[inv.bucket as Bucket], fontWeight: 700 }}>
                      {inv.days > 0 ? inv.days + " dias" : "Al dia"}
                    </td>
                    <td style={{ padding: 10, fontSize: 18, ...theme.numberStyle }}>{inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => openPanel(inv.id)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
                        {openInvoiceId === inv.id ? "Cerrar" : "Gestionar"}
                      </button>
                    </td>
                  </tr>
                  {openInvoiceId === inv.id && (
                    <tr style={{ borderBottom: "1px solid #1F2937" }}>
                      <td colSpan={6} style={{ padding: "0 10px 24px 10px" }}>
                        <div style={{ background: "#11161F", border: "1px solid #1F2937", borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                          <div>
                            <p style={{ fontSize: 14, color: "#8B93A7", fontWeight: 700, marginBottom: 8 }}>AVISO DE COBRO (copiar y enviar manualmente)</p>
                            <textarea
                              value={noticeText}
                              onChange={(e) => setNoticeText(e.target.value)}
                              style={{ width: "100%", minHeight: 180, background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", fontSize: 14, fontFamily: "inherit" }}
                            />
                            <button onClick={copyNotice} style={{ marginTop: 8, background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
                              Copiar Texto
                            </button>
                          </div>
                          <div>
                            <p style={{ fontSize: 14, color: "#8B93A7", fontWeight: 700, marginBottom: 8 }}>REGISTRAR GESTION</p>
                            <select value={newActivityType} onChange={(e) => setNewActivityType(e.target.value)} style={{ width: "100%", background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", fontSize: 14 }}>
                              {Object.entries(ACTIVITY_TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                            <textarea
                              value={newActivityNotes}
                              onChange={(e) => setNewActivityNotes(e.target.value)}
                              placeholder="Notas (opcional)"
                              style={{ width: "100%", minHeight: 60, marginTop: 8, background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", fontSize: 14, fontFamily: "inherit" }}
                            />
                            <button onClick={() => saveActivity(inv.id)} disabled={savingActivity} style={{ marginTop: 8, background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 14px", borderRadius: 8, fontSize: 14, opacity: savingActivity ? 0.5 : 1 }}>
                              Guardar Gestion
                            </button>
                            {panelMessage && <p style={{ marginTop: 8, fontSize: 13, color: panelMessage.startsWith("Error") ? "#f87171" : theme.accent }}>{panelMessage}</p>}

                            <p style={{ fontSize: 13, color: "#8B93A7", fontWeight: 700, marginTop: 16, marginBottom: 6 }}>HISTORIAL</p>
                            {loadingActivities && <p style={{ fontSize: 13, color: "#8B93A7" }}>Cargando...</p>}
                            {!loadingActivities && activities.length === 0 && <p style={{ fontSize: 13, color: "#8B93A7" }}>Sin gestiones registradas todavia.</p>}
                            {!loadingActivities && activities.map((a) => (
                              <div key={a.id} style={{ fontSize: 13, color: "white", borderTop: "1px solid #1F2937", padding: "8px 0" }}>
                                <strong style={{ color: theme.accent }}>{ACTIVITY_TYPE_LABELS[a.activity_type] ?? a.activity_type}</strong>
                                {" "}&middot;{" "}
                                <span style={{ color: "#8B93A7" }}>{new Date(a.created_at).toLocaleString()}</span>
                                {a.notes && <p style={{ marginTop: 4, color: "#8B93A7" }}>{a.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </VerticalPageLayout>
  );
}
