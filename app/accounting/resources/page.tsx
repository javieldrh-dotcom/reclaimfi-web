"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const CATEGORIES = ["Todos", "General", "Contabilidad", "Auditoria Forense", "Licitaciones y APU", "Normativa Fiscal"];

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
      setResources(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "Todos" ? resources : resources.filter((r) => r.category === filter);

  if (loading) return <div style={{ padding: 40, color: "#8FA3C4", background: "#0A1628", minHeight: "100vh" }}>Cargando recursos...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#0A1628", minHeight: "100vh", fontFamily: "''IBM Plex Sans'', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FACC15", fontFamily: "''IBM Plex Serif'', serif" }}>Recursos para Contadores</h1>
      <p style={{ color: "#8FA3C4", marginTop: 8 }}>Guias, plantillas y material de referencia. Actualizado periodicamente.</p>

      <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid " + (filter === c ? "#FACC15" : "#1E3A5F"),
              background: filter === c ? "#FACC1518" : "transparent",
              color: filter === c ? "#FACC15" : "#8FA3C4",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ marginTop: 40, color: "#5A6A85" }}>No hay recursos disponibles en esta categoria todavia.</p>
      ) : (
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((r) => (
            
              <a
              key={r.id}
              href={r.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: 22, background: "#12213B", borderRadius: 14, border: "1px solid #1E3A5F", textDecoration: "none", color: "white", display: "block" }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FACC15", textTransform: "uppercase" }}>{r.category}</span>
              <p style={{ fontSize: 17, fontWeight: 700, marginTop: 8 }}>{r.title}</p>
              {r.description && <p style={{ fontSize: 14, color: "#8FA3C4", marginTop: 6, lineHeight: 1.5 }}>{r.description}</p>}
              <p style={{ fontSize: 13, color: "#FACC15", marginTop: 14, fontWeight: 600 }}>Descargar PDF Ã¢â€ â€œ</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
