"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const CONTINENTS = ["America", "Europa", "Asia", "Africa", "Oceania", "Sin Clasificar"];

export default function CommandCenterPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [situations, setSituations] = useState<any[]>([]);

  const bg = "#050810";
  const panelBg = "#0A1220";
  const glow = "#34D399";
  const glowDim = "#34D39940";
  const amber = "#FACC15";
  const red = "#F87171";
  const ink = "#E8F0FF";
  const inkSoft = "#5A7A8F";

  async function loadAll() {
    const { data: subs } = await supabase.from("subscriptions").select("*, companies(name, country), subscription_plans(plan_name, monthly_price_usd)").order("requested_at", { ascending: false });
    setSubscriptions(subs ?? []);

    const { data: comps } = await supabase.from("companies").select("id, name, country");
    setCompanies(comps ?? []);

    const { data: sits } = await supabase.from("situations").select("*, companies(name)").order("created_at", { ascending: false });
    setSituations(sits ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approveSubscription(id: string) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    await supabase.from("subscriptions").update({ status: "ACTIVE", expires_at: newExpiry.toISOString().slice(0, 10) }).eq("id", id);
    await loadAll();
  }

  async function resolveSituation(id: string) {
    await supabase.from("situations").update({ status: "RESUELTA", resolved_at: new Date().toISOString() }).eq("id", id);
    await loadAll();
  }

  if (loading) return <div style={{ padding: 40, color: glow, background: bg, minHeight: "100vh", fontFamily: "'IBM Plex Mono', monospace" }}>INICIALIZANDO SISTEMA...</div>;

  const isExpired = (s: any) => s.expires_at && new Date(s.expires_at) < new Date();
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE" && !isExpired(s)).length;
  const pendingSubs = subscriptions.filter((s) => s.status === "PENDING_PAYMENT" || (s.status === "ACTIVE" && isExpired(s)));
  const monthlyRevenue = subscriptions.filter((s) => s.status === "ACTIVE" && !isExpired(s)).reduce((sum, s) => sum + (s.subscription_plans?.monthly_price_usd || 0), 0);
  const openSituations = situations.filter((s) => s.status !== "RESUELTA");

  const activeCompanyIds = new Set(
    subscriptions.filter((s) => s.status === "ACTIVE" && !isExpired(s)).map((s) => s.company_id)
  );
  const continentCounts: Record<string, number> = {};
  CONTINENTS.forEach((c) => (continentCounts[c] = 0));
  companies.forEach((c) => {
    if (!activeCompanyIds.has(c.id)) return;
    const continent = mapCountryToContinent(c.country);
    continentCounts[continent] = (continentCounts[continent] || 0) + 1;
  });

  function mapCountryToContinent(code: string): string {
    const america = ["VE", "CO", "AR", "BR", "CL", "PE", "EC", "BO", "PY", "UY", "MX", "GT", "CR", "PA", "HN", "SV", "NI", "DO", "CU", "US", "CA"];
    const europa = ["ES", "PT", "FR", "DE", "IT", "GB", "NL", "BE", "CH", "SE", "NO", "DK", "PL", "IE", "AT", "GR"];
    const asia = ["CN", "JP", "KR", "IN", "ID", "TH", "VN", "PH", "MY", "SG", "TW", "HK", "PK", "BD"];
    const africa = ["NG", "ZA", "EG", "KE", "GH", "MA", "ET", "TZ", "UG", "DZ"];
    const oceania = ["AU", "NZ", "FJ", "PG"];
    if (america.includes(code)) return "America";
    if (europa.includes(code)) return "Europa";
    if (asia.includes(code)) return "Asia";
    if (africa.includes(code)) return "Africa";
    if (oceania.includes(code)) return "Oceania";
    return "Sin Clasificar";
  }

  const panelStyle: React.CSSProperties = {
    background: panelBg,
    border: "1px solid " + glowDim,
    borderRadius: 8,
    padding: 20,
    boxShadow: "0 0 24px " + glowDim + ", inset 0 0 30px rgba(52,211,153,0.03)",
  };

  const typeLabels: Record<string, string> = {
    ERROR_SISTEMA: "ERROR DE SISTEMA",
    DISPUTA_PAGO: "DISPUTA DE PAGO",
    PROBLEMA_SUSCRIPCION: "SUSCRIPCION",
    FUNCIONALIDAD: "FUNCIONALIDAD",
  };
  return (
    <div style={{ background: "radial-gradient(ellipse 100% 60% at 50% 0%, " + panelBg + " 0%, " + bg + " 70%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif", padding: "36px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: glow, boxShadow: "0 0 10px " + glow }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2, color: glow }}>CENTRO DE MANDO</h1>
      </div>
      <p style={{ color: inkSoft, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>SISTEMA OPERATIVO â€” ACCESO NIVEL PROPIETARIO</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 28 }}>
        <div style={panelStyle}>
          <p style={{ fontSize: 11, color: inkSoft, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>SUSCRIPTORES ACTIVOS</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: glow, fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>{activeCount}</p>
        </div>
        <div style={panelStyle}>
          <p style={{ fontSize: 11, color: inkSoft, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>FONDOS EN CUENTA (MENSUAL)</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: amber, fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>${monthlyRevenue.toLocaleString()}</p>
        </div>
        <div style={{ ...panelStyle, border: "1px solid " + (pendingSubs.length > 0 ? amber + "60" : glowDim) }}>
          <p style={{ fontSize: 11, color: inkSoft, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>SOLICITUDES PENDIENTES</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: pendingSubs.length > 0 ? amber : glow, fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>{pendingSubs.length}</p>
        </div>
        <div style={{ ...panelStyle, border: "1px solid " + (openSituations.length > 0 ? red + "60" : glowDim) }}>
          <p style={{ fontSize: 11, color: inkSoft, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>INCIDENCIAS ABIERTAS</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: openSituations.length > 0 ? red : glow, fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>{openSituations.length}</p>
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 20 }}>
        <p style={{ fontSize: 13, color: glow, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, marginBottom: 16 }}>DISTRIBUCION GLOBAL â€” 5 CONTINENTES</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {CONTINENTS.filter((c) => c !== "Sin Clasificar").map((c) => (
            <div key={c} style={{ padding: 14, background: bg, borderRadius: 6, border: "1px solid " + glowDim, textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: glow, fontFamily: "'IBM Plex Mono', monospace" }}>{continentCounts[c]}</p>
              <p style={{ fontSize: 11, color: inkSoft, marginTop: 4 }}>{c}</p>
            </div>
          ))}
          {continentCounts["Sin Clasificar"] > 0 && (
            <div style={{ padding: 14, background: bg, borderRadius: 6, border: "1px solid " + amber + "40", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: amber, fontFamily: "'IBM Plex Mono', monospace" }}>{continentCounts["Sin Clasificar"]}</p>
              <p style={{ fontSize: 11, color: inkSoft, marginTop: 4 }}>Sin Clasificar</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <div style={panelStyle}>
          <p style={{ fontSize: 13, color: amber, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, marginBottom: 14 }}>SOLICITUDES POR APROBAR</p>
          {pendingSubs.length === 0 ? (
            <p style={{ color: inkSoft, fontSize: 13 }}>No hay solicitudes pendientes.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingSubs.map((s) => (
                <div key={s.id} style={{ padding: 12, background: bg, borderRadius: 6, border: "1px solid " + amber + "30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{s.companies?.name ?? "Sin empresa"}</p>
                    <p style={{ fontSize: 12, color: inkSoft }}>{s.subscription_plans?.plan_name}</p>
                  </div>
                  <button onClick={() => approveSubscription(s.id)} style={{ background: amber, color: bg, border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    APROBAR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <p style={{ fontSize: 13, color: red, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, marginBottom: 14 }}>INCIDENCIAS ABIERTAS</p>
          {openSituations.length === 0 ? (
            <p style={{ color: inkSoft, fontSize: 13 }}>No hay incidencias abiertas.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {openSituations.map((s) => (
                <div key={s.id} style={{ padding: 12, background: bg, borderRadius: 6, border: "1px solid " + red + "30" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 11, color: red, fontFamily: "'IBM Plex Mono', monospace" }}>{typeLabels[s.type]}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{s.title}</p>
                      {s.description && <p style={{ fontSize: 12, color: inkSoft, marginTop: 4 }}>{s.description}</p>}
                    </div>
                    <button onClick={() => resolveSituation(s.id)} style={{ background: "none", border: "1px solid " + glow, color: glow, padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                      RESOLVER
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}