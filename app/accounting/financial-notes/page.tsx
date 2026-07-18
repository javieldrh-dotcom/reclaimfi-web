"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function FinancialNotesPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  async function loadNotes(cid: string) {
    const { data } = await supabase.from("financial_statement_notes").select("*").eq("company_id", cid).order("note_number");
    setNotes(data ?? []);
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

  async function addNote() {
    setMessage("");
    if (!companyId || !title || !content) { setMessage("Completa titulo y contenido."); return; }
    const nextNumber = notes.length > 0 ? Math.max(...notes.map((n) => n.note_number)) + 1 : 1;
    const { error } = await supabase.from("financial_statement_notes").insert([{
      company_id: companyId,
      note_number: nextNumber,
      title,
      content,
      period_end: new Date().toISOString().slice(0, 10),
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Nota agregada correctamente.");
    setTitle(""); setContent("");
    await loadNotes(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };
  return (
    <VerticalPageLayout vertical="accounting" title="Notas a los Estados Financieros" subtitle="Politicas contables, detalle de partidas, contingencias y hechos posteriores segun NIIF" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Titulo de la nota (ej. Politicas de Reconocimiento de Ingresos)" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} style={{ ...inputStyle, marginTop: 10 }} placeholder="Contenido de la nota..." />
        <button onClick={addNote} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          AGREGAR NOTA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {notes.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Notas Registradas</h2>
          {notes.map((n) => (
            <div key={n.id} style={{ ...theme.cardStyle, marginTop: 16 }}>
              <p style={{ fontWeight: 700, color: theme.accent, fontSize: 22 }}>Nota {n.note_number}: {n.title}</p>
              <p style={{ marginTop: 10, fontSize: 18, whiteSpace: "pre-wrap" }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
