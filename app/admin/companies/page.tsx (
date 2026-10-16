"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Lista de TODAS las empresas de la plataforma (cualquier contador, no
// solo las del propietario) con edicion rapida de pais/jurisdiccion/
// sector. Antes de esta pantalla, la UNICA forma de corregir la
// jurisdiccion de una empresa (ej. una empresa mexicana que se creo
// como VE por error, o antes de que companies/new guardara
// jurisdiction_code automaticamente) era un UPDATE por SQL que Javiel
// me pedia cada vez -- eso no escala a centenares de contadores
// manejando clientes en distintos paises. Usa /api/admin/companies
// (service_role, gateado al propietario) porque la RLS normal de
// companies solo deja ver/editar las empresas propias o de las que uno
// es miembro.
const COUNTRIES = [
  "VE", "CO", "MX", "AR", "BR", "CL", "PE", "EC", "BO", "PY", "UY", "PA",
  "CR", "GT", "HN", "SV", "NI", "DO", "CU", "PR", "US", "CA", "ES", "PT",
  "FR", "DE", "IT", "GB", "NL", "BE", "CH", "SE", "NO", "DK", "FI", "PL",
  "IE", "AT", "GR", "RU", "TR", "CN", "JP", "KR", "IN", "SG", "AE", "SA",
  "IL", "ZA", "NG", "EG", "AU", "NZ",
];

const SECTORS = [
  "GENERIC", "COMMERCE", "MANUFACTURING", "CONSTRUCTION", "TRANSPORTATION",
  "FINANCIAL", "AGRICULTURE", "HEALTHCARE", "HOSPITALITY", "RESTAURANT", "OIL_GAS",
];

interface CompanyRow {
  id: string;
  name: string;
  tax_id: string | null;
  country: string | null;
  jurisdiction_code: string | null;
  industry_sector: string | null;
  owner_id: string | null;
  created_at: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<CompanyRow>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCompanies(searchTerm = "") {
    setLoading(true);
    const res = await fetch("/api/admin/companies" + (searchTerm ? "?search=" + encodeURIComponent(searchTerm) : ""));
    const json = await res.json().catch(() => ({ success: false }));
    if (json.success) setCompanies(json.companies ?? []);
    else setMessage("Error cargando empresas: " + (json.error ?? "desconocido"));
    setLoading(false);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function startEdit(c: CompanyRow) {
    setEditingId(c.id);
    setDraft({ name: c.name, country: c.country ?? "", jurisdiction_code: c.jurisdiction_code ?? "", industry_sector: c.industry_sector ?? "" });
    setMessage("");
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...draft }),
    });
    const json = await res.json().catch(() => ({ success: false }));
    setSaving(false);
    if (!json.success) {
      setMessage("Error: " + (json.error ?? "no se pudo guardar"));
      return;
    }
    setMessage("Guardado correctamente.");
    setEditingId(null);
    await loadCompanies(search);
  }

  const inputStyle = { padding: 8, background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: 6, color: "white", fontSize: 13 };

  return (
    <div style={{ padding: 40, color: "white", background: "#0A1628", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FACC15", fontFamily: "'IBM Plex Serif', serif" }}>Empresas de la Plataforma</h1>
      <p style={{ color: "#8FA3C4", marginTop: 8, maxWidth: 760 }}>
        Todas las empresas creadas por cualquier contador, no solo las tuyas. Corrige aqui pais, jurisdiccion o sector sin SQL -- por ejemplo cuando una empresa se creo con el pais equivocado.
      </p>
      <p style={{ marginTop: 6 }}>
        <Link href="/admin/companies/new" style={{ color: "#2DD4BF", fontSize: 14 }}>+ Crear empresa nueva</Link>
      </p>

      <div style={{ marginTop: 20, display: "flex", gap: 10, maxWidth: 500 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") loadCompanies(search); }}
          placeholder="Buscar por nombre..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={() => loadCompanies(search)} style={{ padding: "8px 16px", background: "#FACC15", color: "#0A1628", fontWeight: 700, borderRadius: 6, border: "none", cursor: "pointer" }}>
          Buscar
        </button>
      </div>

      {message && <p style={{ marginTop: 14, color: message.startsWith("Error") ? "#F87171" : "#34D399" }}>{message}</p>}

      {loading ? (
        <p style={{ marginTop: 30, color: "#8FA3C4" }}>Cargando...</p>
      ) : (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, maxWidth: 1000 }}>
          {companies.length === 0 && <p style={{ color: "#8FA3C4" }}>Sin empresas encontradas.</p>}
          {companies.map((c) => (
            <div key={c.id} style={{ padding: 16, background: "#12213B", borderRadius: 12, border: "1px solid #1E3A5F" }}>
              {editingId === c.id ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={{ ...inputStyle, minWidth: 220 }} />
                  <select value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} style={inputStyle}>
                    <option value="">Pais...</option>
                    {COUNTRIES.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <select value={draft.jurisdiction_code ?? ""} onChange={(e) => setDraft({ ...draft, jurisdiction_code: e.target.value })} style={inputStyle}>
                    <option value="">Jurisdiccion...</option>
                    {COUNTRIES.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <select value={draft.industry_sector ?? ""} onChange={(e) => setDraft({ ...draft, industry_sector: e.target.value })} style={inputStyle}>
                    <option value="">Sector...</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => saveEdit(c.id)} disabled={saving} style={{ padding: "8px 14px", background: "#34D399", color: "#0A1628", fontWeight: 700, borderRadius: 6, border: "none", cursor: "pointer" }}>
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ padding: "8px 14px", background: "none", border: "1px solid #1E3A5F", color: "#8FA3C4", borderRadius: 6, cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{c.name} <span style={{ color: "#8FA3C4", fontWeight: 400, fontSize: 13 }}>{c.tax_id}</span></p>
                    <p style={{ color: "#8FA3C4", fontSize: 13, marginTop: 4 }}>
                      Pais: <b style={{ color: "white" }}>{c.country ?? "-"}</b> · Jurisdiccion: <b style={{ color: c.jurisdiction_code ? "white" : "#F87171" }}>{c.jurisdiction_code ?? "SIN ASIGNAR"}</b> · Sector: <b style={{ color: "white" }}>{c.industry_sector ?? "-"}</b>
                    </p>
                  </div>
                  <button onClick={() => startEdit(c)} style={{ padding: "8px 14px", background: "none", border: "1px solid #FACC15", color: "#FACC15", borderRadius: 6, cursor: "pointer" }}>
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
