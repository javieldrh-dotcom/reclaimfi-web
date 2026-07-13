"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function FinancialNotesPage() {
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

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%" };
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Notas a los Estados Financieros</h1>
      <p style={{ marginTop: 8, color: "#9ca3af", fontSize: 12 }}>
        Politicas contables, detalle de partidas, contingencias y hechos posteriores segun NIIF.
      </p>

      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 600 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Titulo de la nota (ej. Politicas de Reconocimiento de Ingresos)" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} style={inputStyle} placeholder="Contenido de la nota..." />
        <button onClick={addNote} style={{ padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
          AGREGAR NOTA
        </button>
        {message && <p style={{ color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>}
      </div>

      {notes.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Notas Registradas</h2>
          {notes.map((n) => (
            <div key={n.id} style={{ marginTop: 16, padding: 16, background: "#0d1117", borderRadius: 12 }}>
              <p style={{ fontWeight: 700, color: "#7dd3fc" }}>Nota {n.note_number}: {n.title}</p>
              <p style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
