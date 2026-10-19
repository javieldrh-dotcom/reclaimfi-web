"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

// Antiguedad de Cuentas por Pagar (AP aging / obligaciones de pago). Es el
// espejo de /accounting/ar-collections, pero mirando lo que la empresa
// DEBE en vez de lo que le deben: aqui no se genera un "aviso de cobro"
// para un cliente, sino una nota de planificacion de pago (cuando se va a
// pagar, si se llamo al proveedor, si hay una disputa) para que quien
// administra la tesoreria no pierda el hilo de los compromisos. El status
// OVERDUE se asigna automaticamente via cron (ver
// app/api/cron/mark-overdue-bills) cuando la fecha de vencimiento ya paso.

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
  PAYMENT_SCHEDULED: "Pago programado",
  VENDOR_CONTACTED: "Proveedor contactado",
  DISPUTE: "En disputa",
  NOTE: "Nota",
};

export default function ApAgingPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [bucketFilter, setBucketFilter] = useState<Bucket | "ALL">("ALL");

  const [openBillId, setOpenBillId] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivityType, setNewActivityType] = useState("PAYMENT_SCHEDULED");
  const [newActivityNotes, setNewActivityNotes] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [panelMessage, setPanelMessage] = useState("");

  async function loadBills(cid: string) {
    const { data } = await supabase
      .from("ap_bills")
      .select("*")
      .eq("company_id", cid)
      .in("status", ["PENDING", "OVERDUE"])
      .order("due_date", { ascending: true });
    setBills(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadBills(cid);
    }
    load();
  }, []);

  async function openPanel(billId: string) {
    if (openBillId === billId) { setOpenBillId(null); return; }
    setOpenBillId(billId);
    setPanelMessage("");
    setNewActivityNotes("");
    setNewActivityType("PAYMENT_SCHEDULED");

    setLoadingActivities(true);
    const { data } = await supabase
      .from("ap_payment_notes")
      .select("*")
      .eq("ap_bill_id", billId)
      .order("created_at", { ascending: false });
    setActivities(data ?? []);
    setLoadingActivities(false);
  }

  async function saveActivity(billId: string) {
    if (!companyId) return;
    setSavingActivity(true);
    setPanelMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("ap_payment_notes").insert([{
      company_id: companyId,
      ap_bill_id: billId,
      activity_type: newActivityType,
      notes: newActivityNotes || null,
      created_by: userData?.user?.id ?? null,
    }]);
    if (error) {
      setPanelMessage("Error al registrar la nota: " + error.message);
      setSavingActivity(false);
      return;
    }
    const { data } = await supabase
      .from("ap_payment_notes")
      .select("*")
      .eq("ap_bill_id", billId)
      .order("created_at", { ascending: false });
    setActivities(data ?? []);
    setNewActivityNotes("");
    setPanelMessage("Nota registrada.");
    setSavingActivity(false);
  }

  const enriched = bills.map((b) => {
    const days = daysOverdue(b.due_date);
    return { ...b, days, bucket: bucketFor(days) };
  });

  const buckets: Bucket[] = ["AL_DIA", "D1_30", "D31_60", "D61_90", "D90_MAS"];
  const bucketTotals: Record<Bucket, number> = { AL_DIA: 0, D1_30: 0, D31_60: 0, D61_90: 0, D90_MAS: 0 };
  enriched.forEach((b) => { bucketTotals[b.bucket as Bucket] += b.amount; });
  const grandTotal = Object.values(bucketTotals).reduce((a, b) => a + b, 0);

  const filtered = bucketFilter === "ALL" ? enriched : enriched.filter((b) => b.bucket === bucketFilter);

  return (
    <VerticalPageLayout vertical="accounting" title="Antiguedad de Cuentas por Pagar" subtitle="Obligaciones de pago pendientes por antiguedad -- las facturas vencidas se marcan automaticamente cada dia" fullWidth>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div
            onClick={() => setBucketFilter("ALL")}
            style={{ ...theme.cardStyle, cursor: "pointer", border: bucketFilter === "ALL" ? "2px solid " + theme.accent : theme.cardStyle.border, padding: 16 }}
          >
            <p style={{ fontSize: 13, color: "#8B93A7" }}>TOTAL POR PAGAR</p>
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
            {bills.length === 0 ? "No hay facturas de proveedores pendientes o vencidas." : "No hay facturas en este rango de antiguedad."}
          </p>
        )}

        {filtered.length > 0 && (
          <table style={{ width: "100%", marginTop: 32, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 15, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Factura</th>
                <th style={{ padding: 10 }}>Proveedor</th>
                <th style={{ padding: 10 }}>Vencimiento</th>
                <th style={{ padding: 10 }}>Dias Vencida</th>
                <th style={{ padding: 10 }}>Monto</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <>
                  <tr key={b.id} style={{ borderBottom: openBillId === b.id ? "none" : "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 18 }}>{b.bill_number}</td>
                    <td style={{ padding: 10, fontSize: 18 }}>{b.vendor_name}</td>
                    <td style={{ padding: 10, fontSize: 18 }}>{b.due_date}</td>
                    <td style={{ padding: 10, fontSize: 18, color: BUCKET_COLORS[b.bucket as Bucket], fontWeight: 700 }}>
                      {b.days > 0 ? b.days + " dias" : "Al dia"}
                    </td>
                    <td style={{ padding: 10, fontSize: 18, ...theme.numberStyle }}>{b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => openPanel(b.id)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
                        {openBillId === b.id ? "Cerrar" : "Gestionar"}
                      </button>
                    </td>
                  </tr>
                  {openBillId === b.id && (
                    <tr style={{ borderBottom: "1px solid #1F2937" }}>
                      <td colSpan={6} style={{ padding: "0 10px 24px 10px" }}>
                        <div style={{ background: "#11161F", border: "1px solid #1F2937", borderRadius: 10, padding: 20, maxWidth: 520, margin: "0 auto" }}>
                          <p style={{ fontSize: 14, color: "#8B93A7", fontWeight: 700, marginBottom: 8 }}>REGISTRAR NOTA DE PAGO</p>
                          <select value={newActivityType} onChange={(e) => setNewActivityType(e.target.value)} style={{ width: "100%", background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", fontSize: 14 }}>
                            {Object.entries(ACTIVITY_TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                          </select>
                          <textarea
                            value={newActivityNotes}
                            onChange={(e) => setNewActivityNotes(e.target.value)}
                            placeholder="Notas (opcional) -- ej. fecha acordada de pago, referencia de la llamada, motivo de la disputa"
                            style={{ width: "100%", minHeight: 70, marginTop: 8, background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", fontSize: 14, fontFamily: "inherit" }}
                          />
                          <button onClick={() => saveActivity(b.id)} disabled={savingActivity} style={{ marginTop: 8, background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 14px", borderRadius: 8, fontSize: 14, opacity: savingActivity ? 0.5 : 1 }}>
                            Guardar Nota
                          </button>
                          {panelMessage && <p style={{ marginTop: 8, fontSize: 13, color: panelMessage.startsWith("Error") ? "#f87171" : theme.accent }}>{panelMessage}</p>}

                          <p style={{ fontSize: 13, color: "#8B93A7", fontWeight: 700, marginTop: 16, marginBottom: 6 }}>HISTORIAL</p>
                          {loadingActivities && <p style={{ fontSize: 13, color: "#8B93A7" }}>Cargando...</p>}
                          {!loadingActivities && activities.length === 0 && <p style={{ fontSize: 13, color: "#8B93A7" }}>Sin notas registradas todavia.</p>}
                          {!loadingActivities && activities.map((a) => (
                            <div key={a.id} style={{ fontSize: 13, color: "white", borderTop: "1px solid #1F2937", padding: "8px 0" }}>
                              <strong style={{ color: theme.accent }}>{ACTIVITY_TYPE_LABELS[a.activity_type] ?? a.activity_type}</strong>
                              {" "}&middot;{" "}
                              <span style={{ color: "#8B93A7" }}>{new Date(a.created_at).toLocaleString()}</span>
                              {a.notes && <p style={{ marginTop: 4, color: "#8B93A7" }}>{a.notes}</p>}
                            </div>
                          ))}
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
