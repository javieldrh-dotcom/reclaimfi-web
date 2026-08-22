"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function AMLEngine() {
  const [loading, setLoading] = useState(true);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { count: total } = await supabase.from("alerts").select("*", { count: "exact", head: true });
      const { count: critical } = await supabase.from("alerts").select("*", { count: "exact", head: true }).eq("severity", "CRITICAL");
      const { data: recent } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(8);

      setTotalAlerts(total ?? 0);
      setCriticalCount(critical ?? 0);
      setRecentAlerts(recent ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
        <h1 className="text-5xl font-black text-yellow-300">AML INTELLIGENCE ENGINE</h1>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">
          Centro de alertas de cumplimiento antilavado. El monitoreo automatico de blockchain a gran escala (rastreo de wallets sancionadas, deteccion de mixers, correlacion cruzada de cadenas) esta pendiente de implementacion. Para analizar una wallet especifica con datos reales, usa la herramienta de{" "}
          <Link href="/tracking" className="text-yellow-300 underline">Wallet Tracking</Link>.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/90 p-8">
          <p className="text-xs tracking-[0.3em] text-yellow-400">ALERTAS TOTALES</p>
          <h2 className="mt-5 text-6xl font-black text-yellow-300">{loading ? "-" : totalAlerts}</h2>
        </div>
        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/90 p-8">
          <p className="text-xs tracking-[0.3em] text-red-400">ALERTAS CRITICAS</p>
          <h2 className="mt-5 text-6xl font-black text-red-300">{loading ? "-" : criticalCount}</h2>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-8">
        <h2 className="text-3xl font-black text-yellow-300">ALERTAS RECIENTES</h2>
        <div className="mt-8 space-y-5">
          {loading && <p className="text-gray-500">Cargando...</p>}
          {!loading && recentAlerts.length === 0 && (
            <p className="text-gray-500">No hay alertas registradas todavia.</p>
          )}
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-yellow-500/10 bg-black/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{alert.title}</h3>
                  <p className="mt-3 text-sm text-gray-400">{alert.description}</p>
                </div>
                <span
                  className={
                    "rounded-full px-5 py-3 text-xs font-black tracking-[0.2em] " +
                    (alert.severity === "CRITICAL"
                      ? "bg-red-500/20 text-red-300"
                      : alert.severity === "HIGH"
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-green-500/20 text-green-300")
                  }
                >
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}