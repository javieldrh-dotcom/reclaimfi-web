"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/platform-stats");
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "No se pudo cargar el panel.");
        } else {
          setStats(json);
        }
      } catch (e: any) {
        setError("Error: " + e.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc", fontSize: 20, background: "#0B0E14", minHeight: "100vh" }}>Cargando...</div>;
  if (error) return <div style={{ padding: 40, color: "#f87171", fontSize: 18, background: "#0B0E14", minHeight: "100vh" }}>{error}</div>;

  const cardStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 20 };
  const rowStyle = { display: "flex", flexWrap: "nowrap" as const, overflowX: "auto" as const, gap: 16, paddingBottom: 10 };
  const quickCard = (color: string) => ({
    background: "#12161F", border: "2px solid " + color, borderRadius: 14, padding: "18px 20px",
    color: "white", textDecoration: "none", fontSize: 16, fontWeight: 600, display: "block",
    boxShadow: "0 4px 20px " + color + "30", whiteSpace: "nowrap" as const, flexShrink: 0,
  });

  return (
    <div style={{ padding: 40, color: "white", minHeight: "100vh", background: "#0B0E14" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#facc15" }}>Panel del Propietario</h1>
      <p style={{ marginTop: 6, color: "#9ca3af", fontSize: 15 }}>Vision global real de toda la plataforma - visible unicamente para ti.</p>

      <div style={{ marginTop: 30, ...rowStyle }}>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>EMPRESAS SUSCRITAS</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6 }}>{stats.totalCompanies}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>USUARIOS TOTALES</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#818CF8" }}>{stats.totalUsers}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>CASOS EN TODA LA PLATAFORMA</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#2DD4BF" }}>{stats.totalCases}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>CLAVES DE API ACTIVAS</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#a78bfa" }}>{stats.activeApiKeys}</p>
        </div>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#facc15", fontWeight: 700 }}>Distribucion de Planes</h2>
      <div style={{ marginTop: 16, ...rowStyle }}>
        {Object.entries(stats.planBreakdown).length === 0 ? (
          <p style={{ color: "#8B93A7" }}>Sin datos de planes todavia.</p>
        ) : (
          Object.entries(stats.planBreakdown).map(([plan, count]: [string, any]) => (
            <div key={plan} style={{ ...cardStyle, minWidth: 160, flexShrink: 0, textAlign: "center" as const }}>
              <p style={{ fontSize: 12, color: "#8B93A7" }}>{plan}</p>
              <p style={{ fontSize: 28, fontWeight: 900, marginTop: 6, color: "#facc15" }}>{count}</p>
            </div>
          ))
        )}
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#818CF8", fontWeight: 700 }}>Herramientas de Administracion</h2>
      <div style={{ marginTop: 16, ...rowStyle }}>
        <Link href="/admin/users" style={quickCard("#818CF8")}>Gestion de Usuarios</Link>
        <Link href="/admin/companies/new" style={quickCard("#818CF8")}>Nueva Empresa</Link>
        <Link href="/admin/subscriptions" style={quickCard("#818CF8")}>Suscripciones</Link>
        <Link href="/admin/api-keys" style={quickCard("#818CF8")}>Claves de API Externas</Link>
        <Link href="/admin/resources" style={quickCard("#818CF8")}>Recursos de la Plataforma</Link>
        <Link href="/admin/command-center" style={quickCard("#818CF8")}>Centro de Mando</Link>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#2DD4BF", fontWeight: 700 }}>Empresas Recientes</h2>
      <div style={{ marginTop: 16 }}>
        {stats.recentCompanies.length === 0 ? (
          <p style={{ color: "#8B93A7" }}>Aun no hay empresas registradas.</p>
        ) : (
          stats.recentCompanies.map((c: any) => (
            <div key={c.id} style={{ background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 700 }}>{c.name}</p>
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#facc15" }}>{c.subscription_plan || "SIN PLAN"}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}