"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const NOTE_TEMPLATE = [
  { category: "Informacion General", title: "1. Informacion General de la Entidad", hint: "Razon social, naturaleza de las operaciones, domicilio, forma juridica." },
  { category: "Informacion General", title: "2. Bases de Preparacion y Presentacion", hint: "Declaracion de cumplimiento con NIIF, base de medicion (costo historico), moneda funcional y de presentacion." },
  { category: "Politicas Contables Significativas", title: "3. Reconocimiento de Ingresos", hint: "Politica de reconocimiento de ingresos por venta de bienes/servicios (NIIF 15)." },
  { category: "Politicas Contables Significativas", title: "4. Inventarios", hint: "Metodo de valuacion (costo promedio, FIFO), politica de deterioro." },
  { category: "Politicas Contables Significativas", title: "5. Propiedad, Planta y Equipo", hint: "Metodo de depreciacion, vidas utiles estimadas por categoria de activo." },
  { category: "Politicas Contables Significativas", title: "6. Deterioro de Activos", hint: "Politica de evaluacion de deterioro de activos no financieros." },
  { category: "Politicas Contables Significativas", title: "7. Provisiones y Contingencias", hint: "Criterios de reconocimiento de provisiones, pasivos contingentes." },
  { category: "Politicas Contables Significativas", title: "8. Impuesto sobre la Renta", hint: "Politica de impuesto corriente y diferido (NIC 12)." },
  { category: "Notas Explicativas por Rubro", title: "9. Desglose de Efectivo y Equivalentes", hint: "Detalle de cuentas bancarias, caja chica, inversiones a corto plazo." },
  { category: "Notas Explicativas por Rubro", title: "10. Desglose de Cuentas por Cobrar", hint: "Antiguedad de saldos, estimacion de cuentas incobrables." },
  { category: "Notas Explicativas por Rubro", title: "11. Desglose de Inventarios", hint: "Composicion del inventario por categoria, provisiones por obsolescencia." },
  { category: "Notas Explicativas por Rubro", title: "12. Desglose de Propiedad, Planta y Equipo", hint: "Movimientos del periodo, depreciacion acumulada por categoria." },
  { category: "Notas Explicativas por Rubro", title: "13. Desglose de Cuentas por Pagar", hint: "Composicion de proveedores, plazos de pago." },
  { category: "Notas Explicativas por Rubro", title: "14. Partes Relacionadas", hint: "Transacciones y saldos con partes relacionadas (NIC 24)." },
  { category: "Notas Explicativas por Rubro", title: "15. Hechos Posteriores al Cierre", hint: "Eventos significativos ocurridos entre el cierre y la emision de los estados financieros (NIC 10)." },
];

export default function FinancialNotesPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function loadNotes(cid: string) {
    const { data } = await supabase.from("financial_statement_notes").select("*").eq("company_id", cid).order("note_number");
    setNotes(data ?? []);
    const draftMap: Record<string, string> = {};
    (data ?? []).forEach((n: any) => { draftMap[n.title] = n.content; });
    setDrafts((prev) => ({ ...draftMap, ...prev }));
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadNotes(cid);
    }
    load();
  }, []);

  async function saveNote(template: any, index: number) {
    setMessage("");
    if (!companyId) return;
    const content = drafts[template.title] ?? "";
    if (!content.trim()) { setMessage("Escribe el contenido antes de guardar."); return; }

    const existing = notes.find((n) => n.title === template.title);
    if (existing) {
      const { error } = await supabase.from("financial_statement_notes").update({ content }).eq("id", existing.id);
      if (error) { setMessage("Error: " + error.message); return; }
    } else {
      const { error } = await supabase.from("financial_statement_notes").insert([{
        company_id: companyId,
        note_number: index + 1,
        title: template.title,
        content,
        period_end: new Date().toISOString().slice(0, 10),
      }]);
      if (error) { setMessage("Error: " + error.message); return; }
    }
    setMessage("Nota guardada correctamente: " + template.title);
    await loadNotes(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 17 };
  const categories = Array.from(new Set(NOTE_TEMPLATE.map((n) => n.category)));

  return (
    <VerticalPageLayout vertical="accounting" title="Notas a los Estados Financieros" subtitle="Plantilla estandar segun NIC 1 - Politicas contables, notas explicativas por rubro" fullWidth>
      {message && <p style={{ marginBottom: 16, fontSize: 17, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}

      {categories.map((cat) => (
        <div key={cat} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>{cat}</h2>
          {NOTE_TEMPLATE.filter((n) => n.category === cat).map((template) => {
            const idx = NOTE_TEMPLATE.indexOf(template);
            const isSaved = notes.some((n) => n.title === template.title);
            return (
              <div key={template.title} style={{ ...theme.cardStyle, marginTop: 14, maxWidth: 800 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontWeight: 700, color: "white", fontSize: 18 }}>{template.title}</p>
                  {isSaved && <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>✓ Completada</span>}
                </div>
                <p style={{ fontSize: 14, color: "#8B93A7", marginTop: 4, fontStyle: "italic" }}>{template.hint}</p>
                <textarea
                  value={drafts[template.title] ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [template.title]: e.target.value }))}
                  rows={4}
                  style={{ ...inputStyle, marginTop: 10, width: "100%" }}
                  placeholder="Escribe el contenido de esta nota..."
                />
                <button onClick={() => saveNote(template, idx)} style={{ ...theme.buttonStyle, marginTop: 10, fontSize: 14, padding: "8px 20px" }}>
                  {isSaved ? "ACTUALIZAR NOTA" : "GUARDAR NOTA"}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </VerticalPageLayout>
  );
}