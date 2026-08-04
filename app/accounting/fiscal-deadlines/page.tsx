"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function FiscalDeadlinesPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [obligationName, setObligationName] = useState("");
  const [dueDay, setDueDay] = useState("15");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function loadDeadlines(cid: string) {
    const { data } = await supabase.from("fiscal_deadlines").select("*").eq("company_id", cid).eq("active", true).order("due_day_of_month", { ascending: true });
    setDeadlines(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadDeadlines(cid);
    }
    load();
  }, []);

  async function addDeadline() {
    if (!companyId || !obligationName || !dueDay) { setMessage("Completa el nombre de la obligacion y el dia de vencimiento."); return; }
    const { error } = await supabase.from("fiscal_deadlines").insert([{
      company_id: companyId,
      obligation_name: obligationName,
      due_day_of_month: parseInt(dueDay, 10),
      notes,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setObligationName(""); setDueDay("15"); setNotes("");
    setMessage("Recordatorio guardado.");
    await loadDeadlines(companyId);
  }

  async function removeDeadline(id: string) {
    if (!companyId) return;
    await supabase.from("fiscal_deadlines").update({ active: false }).eq("id", id);
    await loadDeadlines(companyId);
  }

  function daysUntilNext(dueDay: number) {
    const today = new Date();
    const currentDay = today.getDate();
    if (dueDay >= currentDay) return dueDay - currentDay;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return (daysInMonth - currentDay) + dueDay;
  }

  const inputStyle = theme.inputStyle;

  return (
    <VerticalPageLayout vertical="accounting" title="Recordatorios Fiscales" subtitle="Configura tus fechas limite de declaracion y pago para no perder ningun vencimiento" fullWidth>
      <div style={{ maxWidth: 600 }}>
        <div style={theme.cardStyle}>
          <input value={obligationName} onChange={(e) => setObligationName(e.target.value)} style={inputStyle} placeholder="Nombre de la obligacion (ej. Declaracion IVA)" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} style={{ ...inputStyle, width: 120 }} placeholder="Dia del mes" />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} placeholder="Notas (opcional)" />
          </div>
          <button onClick={addDeadline} style={{ ...theme.buttonStyle, marginTop: 12 }}>GUARDAR RECORDATORIO</button>
          {message && <p style={{ marginTop: 8, color: theme.accent }}>{message}</p>}
        </div>

        {deadlines.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {deadlines.map((d) => {
              const days = daysUntilNext(d.due_day_of_month);
              const urgent = days <= 5;
              return (
                <div key={d.id} style={{ ...theme.cardStyle, marginTop: 12, border: urgent ? "1px solid #f87171" : "1px solid #1F2937" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700 }}>{d.obligation_name}</p>
                      <p style={{ fontSize: 14, color: "#8B93A7" }}>Vence el dia {d.due_day_of_month} de cada mes{d.notes ? " — " + d.notes : ""}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: urgent ? "#f87171" : theme.accent }}>{days === 0 ? "HOY" : "En " + days + " dias"}</p>
                      <button onClick={() => removeDeadline(d.id)} style={{ background: "none", border: "none", color: "#8B93A7", fontSize: 12, cursor: "pointer", marginTop: 4 }}>Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </VerticalPageLayout>
  );
}