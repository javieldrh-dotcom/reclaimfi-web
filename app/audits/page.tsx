"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.ts";

interface Evaluation {
  id: number;
  wallet: string;
  audit_type: string;
  priority: string;
  risk: string;
}

export default function AuditsPage() {

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {

    const { data, error } = await supabase
      .from("evaluations")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setEvaluations(data || []);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold text-cyan-400">
              Audits
            </h1>

            <p className="mt-3 text-gray-500">
              Casos institucionales registrados.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            Live Database
          </div>

        </div>

        {/* TABLE */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03]">

          {/* HEAD */}
          <div className="grid grid-cols-5 border-b border-white/5 bg-white/[0.02] px-6 py-5 text-sm text-gray-400">

            <div>ID</div>
            <div>Wallet</div>
            <div>Tipo</div>
            <div>Prioridad</div>
            <div>Estado</div>

          </div>

          {/* DATA */}
          {evaluations.map((item) => (

            <div
              key={item.id}
              className="grid grid-cols-5 items-center border-b border-white/5 px-6 py-5"
            >

              <div className="text-gray-400">
                #{item.id}
              </div>

              <div className="font-medium">
                {item.wallet}
              </div>

              <div>
                {item.audit_type}
              </div>

              <div>
                {item.priority}
              </div>

              <div>

                <span
                  className={`rounded-full px-3 py-1 text-sm

                  ${
                    item.risk.includes("Alto")
                      ? "bg-red-400/10 text-red-300"
                      : item.risk.includes("Revisión")
                      ? "bg-yellow-400/10 text-yellow-300"
                      : "bg-green-400/10 text-green-300"
                  }
                  `}
                >
                  {item.risk}
                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}

