"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function AlertsPage() {

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchAlerts() {

      const { data, error } = await supabase
        .from("wallet_addresses")
        .select("*")
        .in("risk_level", ["HIGH", "MEDIUM"])
        .order("created_at", { ascending: false });

      if (error) {

        console.error(error);

      } else {

        setAlerts(data || []);

      }

      setLoading(false);

    }

    fetchAlerts();

  }, []);

  return (

    <main className="min-h-screen bg-black p-10 text-white relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold text-red-400">
              Centro de Alertas
            </h1>

            <p className="mt-4 text-gray-500">
              Inteligencia AML y escalamiento de actividad sospechosa.
            </p>

          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-red-300">
            MONITOREO AML
          </div>

        </div>

        {/* ALERTS */}
        <div className="mt-12 grid gap-6">

          {loading ? (

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 text-center text-gray-500">
              Cargando alertas AML...
            </div>

          ) : alerts.length === 0 ? (

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 text-center text-gray-500">
              No se detectaron alertas AML.
            </div>

          ) : (

            alerts.map((item) => (

              <div
                key={item.id}
                className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8"
              >

                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                  <div>

                    <h2 className="break-all text-xl font-semibold text-cyan-300">
                      {item.address}
                    </h2>

                    <p className="mt-3 text-gray-400">
                      Anomalia de comportamiento y actividad de transaccion sospechosa detectada.
                    </p>

                  </div>

                  <div
                    className={
                      "rounded-2xl px-5 py-3 text-sm font-semibold " +

                      (item.risk_level === "HIGH"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-yellow-500/20 text-yellow-300")
                    }
                  >
                    {item.risk_level}
                  </div>

                </div>

                {/* GRID */}
                <div className="mt-8 grid gap-6 md:grid-cols-4">

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Puntaje
                    </p>

                    <h3 className="mt-3 text-3xl font-bold">
                      {item.metadata?.score}
                    </h3>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Comportamiento
                    </p>

                    <h3 className="mt-3 text-xl font-semibold">
                      {item.metadata?.behavior}
                    </h3>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Actividad
                    </p>

                    <h3 className="mt-3 text-xl font-semibold">
                      {item.metadata?.activity}
                    </h3>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Conexiones
                    </p>

                    <h3 className="mt-3 text-xl font-semibold">
                      {item.metadata?.connections}
                    </h3>

                  </div>

                </div>

                {/* FOOTER */}
                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">

                  <p className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>

                  <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300">
                    Escalamiento AGI Activo
                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </main>

  );
}

