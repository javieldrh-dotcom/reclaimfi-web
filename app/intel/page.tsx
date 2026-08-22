"use client";

import { useState } from "react";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function IntelPage() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    if (!scenario.trim()) {
      setError("Describe el contexto de la investigacion.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/intel-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "No se pudo completar el analisis.");
      } else {
        setResult(json.result);
      }
    } catch (e: any) {
      setError("Error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10 relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-cyan-400">Centro de Inteligencia</h1>
            <p className="mt-4 text-gray-500">
              Analisis de notas de investigacion con IA real, basado unicamente en lo que describes.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            IA con Claude
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-semibold">Analisis de Inteligencia</h2>
          <textarea
            placeholder="Describe el comportamiento de la transaccion, notas de investigacion, o preocupaciones de AML..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="mt-6 h-40 w-full rounded-2xl border border-white/10 bg-black/40 p-5 outline-none"
          />
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="mt-6 rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Analizando..." : "Ejecutar Analisis con IA"}
          </button>
          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>

        {result && (
          <div className="mt-10 grid gap-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Clasificacion</p>
                <h3 className="mt-4 text-2xl font-bold text-cyan-300">{result.classification}</h3>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Prioridad</p>
                <h3
                  className={
                    "mt-4 text-3xl font-bold " +
                    (result.priority === "CRITICAL" || result.priority === "HIGH"
                      ? "text-red-400"
                      : result.priority === "MEDIUM"
                      ? "text-yellow-400"
                      : "text-green-400")
                  }
                >
                  {result.priority}
                </h3>
              </div>
            </div>

            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">
              <h2 className="text-2xl font-semibold text-red-300">Observaciones Clave</h2>
              <div className="mt-6 grid gap-4">
                {result.keyObservations.length === 0 ? (
                  <p className="text-gray-500">No se identificaron observaciones especificas en el texto proporcionado.</p>
                ) : (
                  result.keyObservations.map((item: string, index: number) => (
                    <div key={index} className="rounded-2xl border border-white/5 bg-black/30 p-5">
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-8">
              <h2 className="text-2xl font-semibold text-cyan-300">Recomendacion</h2>
              <p className="mt-5 leading-8 text-gray-300">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}