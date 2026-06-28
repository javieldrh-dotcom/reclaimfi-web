"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AlertsPage() {

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchAlerts() {

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .in("risk_level", ["High Risk", "Medium Risk"])
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

    <main className="min-h-screen bg-black p-10 text-white">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold text-red-400">
              Alerts Center
            </h1>

            <p className="mt-4 text-gray-500">
              AML intelligence and suspicious activity escalation.
            </p>

          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-red-300">
            AML MONITORING
          </div>

        </div>

        {/* ALERTS */}
        <div className="mt-12 grid gap-6">

          {loading ? (

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 text-center text-gray-500">
              Loading AML alerts...
            </div>

          ) : alerts.length === 0 ? (

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 text-center text-gray-500">
              No AML alerts detected.
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
                      Behavioral anomaly and suspicious transaction activity detected.
                    </p>

                  </div>

                  <div
                    className={
                      "rounded-2xl px-5 py-3 text-sm font-semibold " +

                      (item.risk_level === "High Risk"
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
                      Score
                    </p>

                    <h3 className="mt-3 text-3xl font-bold">
                      {item.score}
                    </h3>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Behavior
                    </p>

                    <h3 className="mt-3 text-xl font-semibold">
                      {item.behavior}
                    </h3>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Activity
                    </p>

                    <h3 className="mt-3 text-xl font-semibold">
                      {item.activity}
                    </h3>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                    <p className="text-sm text-gray-500">
                      Connections
                    </p>

                    <h3 className="mt-3 text-xl font-semibold">
                      {item.connections}
                    </h3>

                  </div>

                </div>

                {/* FOOTER */}
                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">

                  <p className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>

                  <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300">
                    AGI Escalation Active
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

