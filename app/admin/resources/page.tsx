"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const CATEGORIES = ["General", "Contabilidad", "Auditoria Forense", "Licitaciones y APU", "Normativa Fiscal"];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function loadResources() {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    setResources(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, []);

  async function handleUpload() {
    if (!file || !title.trim()) {
      setMessage("Titulo y archivo son obligatorios.");
      return;
    }
    if (file.type !== "application/pdf") {
      setMessage("Solo se permiten archivos PDF.");
      return;
    }
    setUploading(true);
    setMessage("");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = Date.now() + "_" + safeName;

    const { error: uploadError } = await supabase.storage.from("resources").upload(path, file);
    if (uploadError) {
      setMessage("Error al subir el archivo: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);

    const { error: insertError } = await supabase.from("resources").insert({
      title: title.trim(),
      description: description.trim(),
      category,
      file_url: urlData.publicUrl,
      file_name: file.name,
    });

    if (insertError) {
      setMessage("Error al guardar el recurso: " + insertError.message);
    } else {
      setMessage("Recurso publicado correctamente.");
      setTitle("");
      setDescription("");
      setFile(null);
      await loadResources();
    }
    setUploading(false);
  }

  async function handleDelete(id: string, fileUrl: string) {
    if (!window.confirm("Eliminar este recurso permanentemente?")) return;
    const path = fileUrl.split("/resources/").pop();
    if (path) await supabase.storage.from("resources").remove([path]);
    await supabase.from("resources").delete().eq("id", id);
    await loadResources();
  }

  const inputStyle = { width: "100%", padding: 12, background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: 8, color: "white", fontSize: 14, marginBottom: 14 };

  if (loading) return <div style={{ padding: 40, color: "#8FA3C4", background: "#0A1628", minHeight: "100vh" }}>Cargando...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#0A1628", minHeight: "100vh", fontFamily: "''IBM Plex Sans'', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FACC15", fontFamily: "''IBM Plex Serif'', serif" }}>Administrar Recursos</h1>
      <p style={{ color: "#8FA3C4", marginTop: 8 }}>Solo tu, como propietario de la plataforma, puedes publicar recursos aqui. Los usuarios solo pueden verlos y descargarlos.</p>

      <div style={{ marginTop: 32, padding: 24, background: "#12213B", borderRadius: 16, border: "1px solid #1E3A5F", maxWidth: 600 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Publicar Nuevo Recurso</h2>
        <input type="text" placeholder="Titulo del recurso" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        <textarea placeholder="Descripcion breve" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ ...inputStyle, padding: 8 }} />
        <button onClick={handleUpload} disabled={uploading} style={{ width: "100%", padding: 14, background: "#FACC15", color: "#0A1628", fontWeight: 800, borderRadius: 10, border: "none", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
          {uploading ? "Subiendo..." : "Publicar Recurso"}
        </button>
        {message && <p style={{ marginTop: 12, fontSize: 14, color: message.includes("Error") ? "#F87171" : "#34D399" }}>{message}</p>}
      </div>

      <h2 style={{ marginTop: 40, fontSize: 18, color: "#8FA3C4" }}>Recursos Publicados ({resources.length})</h2>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, maxWidth: 700 }}>
        {resources.map((r) => (
          <div key={r.id} style={{ padding: 18, background: "#12213B", borderRadius: 12, border: "1px solid #1E3A5F", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700 }}>{r.title}</p>
              <p style={{ fontSize: 13, color: "#8FA3C4", marginTop: 4 }}>{r.category} · {r.file_name}</p>
            </div>
            <button onClick={() => handleDelete(r.id, r.file_url)} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}