"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabase";

export default function CompanySwitcher() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  async function loadCompanies() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data } = await supabase
      .from("user_companies")
      .select("company_id, last_active_at, companies(id, name, tax_id)")
      .eq("user_id", userData.user.id)
      .order("last_active_at", { ascending: false });
    const list = (data ?? []).map((r: any) => r.companies).filter(Boolean);
    setCompanies(list);
    if (list.length > 0) setCurrent(list[0]);
  }

  useEffect(() => {
    loadCompanies();
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function switchTo(company: any) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { error, data } = await supabase.from("user_companies").update({ last_active_at: new Date().toISOString() }).eq("user_id", userData.user.id).eq("company_id", company.id).select();
    if (error) { alert("Error al cambiar de empresa: " + error.message); return; }
    if (!data || data.length === 0) { alert("No se pudo actualizar (0 filas afectadas). Revisa la consola."); return; }
    setCurrent(company);
    setOpen(false);
    window.location.reload();
  }

  if (companies.length <= 1) return null;

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.tax_id ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 50 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#0d1117", border: "1px solid #1a3050", borderRadius: 10, cursor: "pointer", fontSize: 14, color: "white", width: "fit-content" }}
      >
        <span style={{ color: "#818CF8", fontWeight: 700 }}>{current?.name ?? "Cargando..."}</span>
        <span style={{ color: "#8B93A7", fontSize: 12 }}>▾ Cambiar Empresa</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "110%", left: 0, background: "#0d1117", border: "1px solid #1a3050", borderRadius: 10, minWidth: 280, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa o RIF..."
            style={{ width: "100%", boxSizing: "border-box", padding: 10, background: "#000a16", border: "none", borderBottom: "1px solid #1a3050", color: "white", fontSize: 13 }}
          />
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => switchTo(c)}
                style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: c.id === current?.id ? "#818CF8" : "white", background: c.id === current?.id ? "#818CF820" : "transparent", borderBottom: "1px solid #1a305050" }}
              >
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                {c.tax_id && <div style={{ fontSize: 12, color: "#8B93A7" }}>{c.tax_id}</div>}
              </div>
            ))}
            {filtered.length === 0 && <p style={{ padding: 14, fontSize: 13, color: "#8B93A7" }}>Sin resultados.</p>}
          </div>
        </div>
      )}
    </div>
  );
}