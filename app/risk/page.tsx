"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

interface Evaluation {
  id: number;
  wallet: string;
  priority: string;
  risk: string;
  audit_type: string;
}

export default function RiskPage() {

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    fetchRiskData();
  }, []);

  async function fetchRiskData() {

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

  const highRisk = evaluations.filter((e) =>
    e.risk.includes("Alto")
  ).length;

  const manualReview = evaluations.filter((e) =>
    e.risk.includes("RevisiÃ³n")
  ).length;

  const lowRisk = evaluations.filter((e) =>
    e.risk.includes("Bajo")
  ).length;

  return (
    <main className="min-h-screen bg-black text-white p-10 relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold text-cyan-400">
              Risk Engine
            </h1>

            <p className="mt-3 text-gray-500">
              Sistema dinÃ¡mico AML.
            </p>
          </div>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
            <p className="text-gray-500">
              Riesgo Alto
            </p>

            <h2 className="mt-4 text-5xl font-bold text-red-400">
              {highRisk}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
            <p className="text-gray-500">
              RevisiÃ³n Manual
            </p>

            <h2 className="mt-4 text-5xl font-bold text-yellow-400">
              {manualReview}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
            <p className="text-gray-500">
              Riesgo Bajo
            </p>

            <h2 className="mt-4 text-5xl font-bold text-green-400">
              {lowRisk}
            </h2>
          </div>

        </div>

      </div>

    </main>
  );
}

