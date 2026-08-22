import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Metrics {
  totalCases: number;
  highRisk: number;
  openCases: number;
  evidenceFiles: number;
}

export default function RiskAnalytics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalCases: 0,
    highRisk: 0,
    openCases: 0,
    evidenceFiles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);

    const { data: casesData } = await supabase.from("cases").select("*");
    const { data: evidenceData } = await supabase.from("case_evidence").select("*");

    const totalCases = casesData?.length || 0;
    const highRisk = casesData?.filter((c) => c.priority === "HIGH").length || 0;
    const openCases = casesData?.filter((c) => c.status === "OPEN").length || 0;
    const evidenceFiles = evidenceData?.length || 0;

    setMetrics({ totalCases, highRisk, openCases, evidenceFiles });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <h2 className="text-2xl font-black text-cyan-300">CARGANDO ANALITICA DE RIESGO...</h2>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-5xl font-black text-cyan-300">ANALITICA GLOBAL DE RIESGO</h1>
        <p className="mt-4 text-gray-400">Metricas reales de casos y evidencia registrados.</p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8">
          <p className="text-xs tracking-[0.3em] text-cyan-400">CASOS TOTALES</p>
          <h2 className="mt-4 text-5xl font-black text-cyan-300">{metrics.totalCases}</h2>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-8">
          <p className="text-xs tracking-[0.3em] text-yellow-400">CASOS ABIERTOS</p>
          <h2 className="mt-4 text-5xl font-black text-yellow-400">{metrics.openCases}</h2>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-black/40 p-8">
          <p className="text-xs tracking-[0.3em] text-red-400">RIESGO ALTO</p>
          <h2 className="mt-4 text-5xl font-black text-red-400">{metrics.highRisk}</h2>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-black/40 p-8">
          <p className="text-xs tracking-[0.3em] text-green-400">ARCHIVOS DE EVIDENCIA</p>
          <h2 className="mt-4 text-5xl font-black text-green-400">{metrics.evidenceFiles}</h2>
        </div>
      </div>
    </div>
  );
}