"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CaseManagement from "../components/CaseManagement";
import AMLEngine from "../components/AMLEngine";
import AIEngine from "../components/AIEngine";
import CyberSecurity from "../components/CyberSecurity";
import { supabase } from "@/app/lib/supabase";

export default function CommandCenterPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [activeCases, setActiveCases] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [blockchainAlerts, setBlockchainAlerts] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { count: casesCount } = await supabase.from("cases").select("*", { count: "exact", head: true }).eq("status", "OPEN");
      const { count: criticalCount } = await supabase.from("alerts").select("*", { count: "exact", head: true }).eq("severity", "CRITICAL");
      const { count: allAlertsCount } = await supabase.from("alerts").select("*", { count: "exact", head: true });
      const { count: blockchainCount } = await supabase.from("alerts").select("*", { count: "exact", head: true }).eq("alert_type", "BLOCKCHAIN");
      const { data: recent } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(4);

      setActiveCases(casesCount ?? 0);
      setCriticalAlerts(criticalCount ?? 0);
      setTotalAlerts(allAlertsCount ?? 0);
      setBlockchainAlerts(blockchainCount ?? 0);
      setRecentAlerts(recent ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function severityColor(sev: string) {
    if (sev === "CRITICAL") return { border: "border-red-500/20", bg: "bg-red-500/20", text: "text-red-300" };
    if (sev === "HIGH") return { border: "border-yellow-500/20", bg: "bg-yellow-500/20", text: "text-yellow-300" };
    return { border: "border-cyan-500/20", bg: "bg-cyan-500/20", text: "text-cyan-300" };
  }

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#010409] text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="flex-1 overflow-y-auto p-10">
        {activeTab === "overview" && (
          <div>
            <div className="rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-12 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-7xl font-black tracking-tight text-blue-400">
                    AUDIT GLOBAL
                    <br />
                    INTELLIGENCE
                  </h1>
                  <p className="mt-6 max-w-4xl text-lg leading-relaxed text-gray-400">
                    Plataforma global de inteligencia forense para monitoreo AML, operaciones de ciberseguridad, inteligencia de blockchain, automatizacion de auditoria, cumplimiento institucional, y gestion de riesgo operacional.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-4">
              <div className="rounded-3xl border border-blue-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(59,130,246,0.08)]">
                <p className="text-xs tracking-[0.3em] text-blue-400">CASOS ACTIVOS</p>
                <h2 className="mt-5 text-6xl font-black text-blue-300">{loading ? "-" : activeCases}</h2>
              </div>
              <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(239,68,68,0.08)]">
                <p className="text-xs tracking-[0.3em] text-red-400">ALERTAS CRITICAS</p>
                <h2 className="mt-5 text-6xl font-black text-red-300">{loading ? "-" : criticalAlerts}</h2>
              </div>
              <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(234,179,8,0.08)]">
                <p className="text-xs tracking-[0.3em] text-yellow-400">ALERTAS TOTALES</p>
                <h2 className="mt-5 text-6xl font-black text-yellow-300">{loading ? "-" : totalAlerts}</h2>
              </div>
              <div className="rounded-3xl border border-green-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(34,197,94,0.08)]">
                <p className="text-xs tracking-[0.3em] text-green-400">ALERTAS DE BLOCKCHAIN</p>
                <h2 className="mt-5 text-6xl font-black text-green-300">{loading ? "-" : blockchainAlerts}</h2>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-blue-300">EVENTOS RECIENTES</h2>
              </div>

              <div className="mt-8 space-y-4">
                {loading && <p className="text-gray-500">Cargando...</p>}
                {!loading && recentAlerts.length === 0 && (
                  <p className="text-gray-500">No hay alertas registradas todavia.</p>
                )}
                {recentAlerts.map((alert) => {
                  const colors = severityColor(alert.severity);
                  return (
                    <div key={alert.id} className={"rounded-2xl border " + colors.border + " bg-black/30 p-5"}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white">{alert.title}</h3>
                          <p className="mt-2 text-sm text-gray-400">{alert.description}</p>
                        </div>
                        <span className={"rounded-full " + colors.bg + " px-4 py-2 text-xs font-black " + colors.text}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "cases" && <CaseManagement />}
        {activeTab === "aml" && <AMLEngine />}
        {activeTab === "ai" && <AIEngine />}
        {activeTab === "cybersecurity" && <CyberSecurity />}

        {activeTab === "blockchain" && (
          <div>
            <h1 className="text-5xl font-black text-yellow-300">BLOCKCHAIN INTELLIGENCE</h1>
            <p className="mt-4 text-gray-500">Modulo pendiente de desarrollo.</p>
          </div>
        )}
        {activeTab === "compliance" && (
          <div>
            <h1 className="text-5xl font-black text-purple-300">COMPLIANCE ENGINE</h1>
            <p className="mt-4 text-gray-500">Modulo pendiente de desarrollo.</p>
          </div>
        )}
        {activeTab === "risk" && (
          <div>
            <h1 className="text-5xl font-black text-orange-300">GLOBAL RISK MAP</h1>
            <p className="mt-4 text-gray-500">Modulo pendiente de desarrollo.</p>
          </div>
        )}
        {activeTab === "reports" && (
          <div>
            <h1 className="text-5xl font-black text-pink-300">REPORTS CENTER</h1>
            <p className="mt-4 text-gray-500">Modulo pendiente de desarrollo.</p>
          </div>
        )}
      </section>
    </main>
  );
}