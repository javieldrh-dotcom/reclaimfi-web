"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);

  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceNote, setMaintenanceNote] = useState("");

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
    async function loadMaintenance() {
      try {
        const res = await fetch("/api/admin/maintenance");
        const json = await res.json();
        if (json.success && json.config) {
          setMaintenanceMode(!!json.config.maintenance_mode);
          setMaintenanceMessage(json.config.maintenance_message ?? "");
        }
      } catch {
        // el panel sigue siendo utilizable aunque esto falle; solo no se
        // muestra la tarjeta de mantenimiento
      }
    }
    load();
    loadMaintenance();
  }, []);

  async function toggleMaintenance() {
    if (maintenanceMode === null) return;
    setMaintenanceSaving(true);
    setMaintenanceNote("");
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: !maintenanceMode }),
      });
      const json = await res.json();
      if (json.success) {
        setMaintenanceMode(!!json.config.maintenance_mode);
        setMaintenanceNote(json.config.maintenance_mode ? "Sitio oculto al publico (modo mantenimiento activo)." : "Sitio visible al publico.");
      } else {
        setMaintenanceNote("Error: " + json.error);
      }
    } catch (e: any) {
      setMaintenanceNote("Error: " + e.message);
    }
    setMaintenanceSaving(false);
  }

  async function saveMaintenanceMessage() {
    setMaintenanceSaving(true);
    setMaintenanceNote("");
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMessage }),
      });
      const json = await res.json();
      setMaintenanceNote(json.success ? "Mensaje actualizado." : "Error: " + json.error);
    } catch (e: any) {
      setMaintenanceNote("Error: " + e.message);
    }
    setMaintenanceSaving(false);
  }

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

      {maintenanceMode !== null && (
        <div style={{
          marginTop: 24, padding: 22, borderRadius: 14, maxWidth: 1300,
          background: maintenanceMode ? "#F8717115" : "#2DD4BF15",
          border: "1px solid " + (maintenanceMode ? "#F8717160" : "#2DD4BF60"),
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: maintenanceMode ? "#F87171" : "#2DD4BF" }}>
                {maintenanceMode ? "SITIO EN CONSTRUCCION — oculto al publico" : "SITIO VISIBLE AL PUBLICO"}
              </p>
              <p style={{ marginTop: 4, fontSize: 13, color: "#8B93A7", maxWidth: 560 }}>
                {maintenanceMode
                  ? "Cualquier visitante (menos tu) ve la pagina de mantenimiento en vez de la landing o la app."
                  : "La landing publica y la app ya son visibles para cualquier visitante."}
              </p>
            </div>
            <button
              onClick={toggleMaintenance}
              disabled={maintenanceSaving}
              style={{
                padding: "12px 24px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 14, cursor: maintenanceSaving ? "default" : "pointer",
                background: maintenanceMode ? "#2DD4BF" : "#F87171", color: "#0B0E14", opacity: maintenanceSaving ? 0.6 : 1, whiteSpace: "nowrap",
              }}
            >
              {maintenanceSaving ? "Guardando..." : maintenanceMode ? "Publicar sitio" : "Ocultar sitio (mantenimiento)"}
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: "#8B93A7", fontWeight: 700 }}>MENSAJE EN LA PANTALLA DE MANTENIMIENTO</label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={2}
              style={{ marginTop: 6, width: "100%", maxWidth: 760, background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
            <div>
              <button
                onClick={saveMaintenanceMessage}
                disabled={maintenanceSaving}
                style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, border: "1px solid #1a3050", background: "#0d1117", color: "#8B93A7", fontSize: 13, fontWeight: 700, cursor: maintenanceSaving ? "default" : "pointer" }}
              >
                Guardar mensaje
              </button>
            </div>
          </div>

          {maintenanceNote && <p style={{ marginTop: 10, fontSize: 13, color: maintenanceNote.startsWith("Error") ? "#F87171" : "#2DD4BF" }}>{maintenanceNote}</p>}
        </div>
      )}

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

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#2DD4BF", fontWeight: 700 }}>Suscripciones</h2>
      <div style={{ marginTop: 16, ...rowStyle }}>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0, border: "1px solid #2DD4BF40" }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>ACTIVAS / SOLVENTES</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#2DD4BF" }}>{stats.subscriptions?.active ?? 0}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 200, flexShrink: 0, border: "1px solid #F8717140" }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>VENCIDAS</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#F87171" }}>{stats.subscriptions?.expired ?? 0}</p>
        </div>
        <Link href="/admin/subscriptions" style={{ ...quickCard("#2DD4BF"), minWidth: 200, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" as const }}>
          Ver detalle de suscripciones →
        </Link>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#facc15", fontWeight: 700 }}>Control de Visitas</h2>
      <div style={{ marginTop: 16, ...rowStyle }}>
        <div style={{ ...cardStyle, minWidth: 180, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>VISITAS (24H)</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6 }}>{stats.visits?.last24h ?? 0}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 180, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>VISITAS (7 DIAS)</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6 }}>{stats.visits?.last7d ?? 0}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 180, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>VISITAS (30 DIAS)</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6 }}>{stats.visits?.last30d ?? 0}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 180, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>VISITANTES UNICOS (7D)</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#818CF8" }}>{stats.visits?.uniqueVisitors7d ?? 0}</p>
        </div>
        <div style={{ ...cardStyle, minWidth: 180, flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>VISITAS TOTALES</p>
          <p style={{ fontSize: 32, fontWeight: 900, marginTop: 6, color: "#2DD4BF" }}>{stats.visits?.total ?? 0}</p>
        </div>
      </div>

      {stats.visits?.topPages7d?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "#8B93A7" }}>Paginas mas visitadas (ultimos 7 dias)</p>
          <div style={{ marginTop: 10 }}>
            {stats.visits.topPages7d.map((p: any) => (
              <div key={p.path} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#e5e7eb", fontFamily: "monospace" }}>{p.path}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#facc15" }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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