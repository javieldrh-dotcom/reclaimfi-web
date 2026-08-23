"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function ApuDashboard() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [awardedCount, setAwardedCount] = useState(0);
  const [catalogCount, setCatalogCount] = useState(0);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      if (!cid) { setLoading(false); return; }

      const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");

      const { data: projects } = await supabase.from("apu_projects").select("*").eq("company_id", cid).order("created_at", { ascending: false });
      const allProjects = projects ?? [];
      setTotalProjects(allProjects.length);
      setDraftCount(allProjects.filter((p: any) => p.status === "DRAFT").length);
      setSubmittedCount(allProjects.filter((p: any) => p.status === "SUBMITTED").length);
      setAwardedCount(allProjects.filter((p: any) => p.status === "AWARDED").length);
      setRecentProjects(allProjects.slice(0, 5));

      const { count: catalogItemCount } = await supabase.from("apu_price_catalog").select("*", { count: "exact", head: true }).eq("company_id", cid);
      setCatalogCount(catalogItemCount ?? 0);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc", fontSize: 20 }}>Cargando...</div>;

  const cardStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 20 };
  const rowStyle = { display: "flex", flexWrap: "nowrap" as const, overflowX: "auto" as const, gap: 16, paddingBottom: 10 };
  const quickCard = (color: string) => ({
    background: "#12161F", border: "2px solid " + color, borderRadius: 14, padding: "18px 20px",
    color: "white", textDecoration: "none", fontSize: 16, fontWeight: 600, display: "block",
    boxShadow: "0 4px 20px " + color + "30", whiteSpace: "nowrap" as const, flexShrink: 0,
  });

  const statusLabels: Record<string, string> = { DRAFT: "Borrador", SUBMITTED: "Presentado", AWARDED: "Adjudicado", REJECTED: "Rechazado" };
  const statusColors: Record<string, string> = { DRAFT: "#8B93A7", SUBMITTED: "#facc15", AWARDED: "#4ade80", REJECTED: "#f87171" };

  return (
    <div style={{ padding: 40, color: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Analisis de Precios Unitarios</h1>
      <p style={{ marginTop: 6, color: "#9ca3af", fontSize: 15 }}>{companyName}</p>

      <div style={{ marginTop: 30, ...rowStyle }}>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>PROYECTOS TOTALES</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6 }}>{totalProjects}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>EN BORRADOR</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: statusColors.DRAFT }}>{draftCount}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>PRESENTADOS</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: statusColors.SUBMITTED }}>{submittedCount}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>ADJUDICADOS</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: statusColors.AWARDED }}>{awardedCount}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>ITEMS EN CATALOGO</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#a78bfa" }}>{catalogCount}</p>
        </div>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#818CF8", fontWeight: 700 }}>Gestion de Proyectos</h2>
      <div style={{ marginTop: 16, ...rowStyle }}>
        <Link href="/apu/projects" style={quickCard("#818CF8")}>Proyectos y Pliegos</Link>
        <Link href="/apu/price-catalog" style={quickCard("#818CF8")}>Catalogo de Precios</Link>
        <Link href="/apu/fscl" style={quickCard("#818CF8")}>Calculadora FSCL</Link>
        <Link href="/apu/financial-qualification" style={quickCard("#818CF8")}>Capacidad Financiera</Link>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#2DD4BF", fontWeight: 700 }}>Proyectos Recientes</h2>
      <div style={{ marginTop: 16 }}>
        {recentProjects.length === 0 ? (
          <p style={{ color: "#8B93A7" }}>Aun no has creado ningun proyecto. Empieza subiendo un pliego en Proyectos y Pliegos.</p>
        ) : (
          recentProjects.map((p) => (
            <Link
              key={p.id}
              href={"/apu/partidas/" + p.id}
              style={{
                display: "block",
                background: "#0d1117",
                border: "1px solid #1a3050",
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{p.procedure_number || "Sin numero de procedimiento"}</p>
                  <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>{p.contracting_entity || "Sin entidad contratante"}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: statusColors[p.status] || "#8B93A7" }}>
                  {statusLabels[p.status] || p.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}