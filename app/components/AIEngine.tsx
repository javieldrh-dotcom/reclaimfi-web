"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function AIEngine() {
  const [loading, setLoading] = useState(true);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { count: total } = await supabase.from("alerts").select("*", { count: "exact", head: true });
      const { count: highRisk } = await supabase.from("alerts").select("*", { count: "exact", head: true }).in("severity", ["HIGH", "CRITICAL"]);
      const { data: recent } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(7);

      setTotalAlerts(total ?? 0);
      setHighRiskCount(highRisk ?? 0);
      setEvents(recent ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-5xl font-black text-cyan-300">AI ENGINE</h1>
      <p className="mt-4 text-gray-400">
        Analitica operacional y deteccion de anomalias, basada en las alertas reales registradas en el sistema.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-green-500/20 bg-black/40 p-8">
          <p className="text-xs tracking-[0.3em] text-green-400">ALERTAS TOTALES</p>
          <h2 className="mt-4 text-4xl font-black text-green-400">{loading ? "-" : totalAlerts}</h2>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-black/40 p-8">
          <p className="text-xs tracking-[0.3em] text-red-400">ALERTAS DE RIESGO ALTO/CRITICO</p>
          <h2 className="mt-4 text-4xl font-black text-red-400">{loading ? "-" : highRiskCount}</h2>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">
        <h2 className="mb-6 text-2xl font-bold text-cyan-300">ALERTAS RECIENTES</h2>
        <div className="space-y-4">
          {loading && <p className="text-gray-500">Cargando...</p>}
          {!loading && events.length === 0 && <p className="text-gray-500">No hay alertas registradas todavia.</p>}
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-cyan-400/10 bg-black/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">{event.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{event.description}</p>
                </div>
                <span
                  className={
                    "rounded-full px-4 py-2 text-xs font-bold " +
                    (event.severity === "CRITICAL" || event.severity === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400")
                  }
                >
                  {event.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}