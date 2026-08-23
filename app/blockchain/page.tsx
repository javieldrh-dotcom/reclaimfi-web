"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function BlockchainPage() {
  const [wallet, setWallet] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeWallet() {
    if (!wallet.trim()) {
      setError("Ingresa una direccion de wallet.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/wallet-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.trim() }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "No se pudo analizar la wallet.");
        setLoading(false);
        return;
      }

      const { error: dbError } = await supabase.from("wallets").insert([{
        address: wallet.trim(),
        risk_level: json.analysis.riskLevel,
        score: json.ofacSanctioned ? 0 : (json.analysis.riskLevel === "HIGH" ? 25 : json.analysis.riskLevel === "MEDIUM" ? 60 : 90),
        behavior: json.analysis.behavior,
        activity: json.ofacSanctioned ? "OFAC Sanctioned" : "Normal",
        connections: json.txCount,
      }]);
      if (dbError) console.error("[Supabase Error]", dbError);

      setAnalysis({ ...json, wallet: wallet.trim() });
    } catch (e: any) {
      setError("Error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-cyan-400">Inteligencia de Blockchain</h1>
            <p className="mt-4 text-gray-500">Monitoreo y analisis forense real de wallets (Bitcoin).</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            Datos Reales de Blockchain
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-semibold">Analisis de Wallet</h2>
          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="Ingresa una direccion de Bitcoin..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />
            <button
              onClick={analyzeWallet}
              disabled={loading}
              className="rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? "Analizando..." : "Analizar Wallet"}
            </button>
          </div>
          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>

        {analysis && (
          <div className="mt-10 grid gap-8">
            {analysis.ofacSanctioned && (
              <div className="rounded-3xl border-2 border-red-500 bg-red-500/20 p-8 animate-pulse">
                <h2 className="text-2xl font-black text-red-300">ALERTA: DIRECCION SANCIONADA POR OFAC</h2>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-4">
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Balance</p>
                <h3 className="mt-4 text-3xl font-bold text-cyan-400">{analysis.balanceBtc} BTC</h3>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Riesgo</p>
                <h3
                  className={
                    "mt-4 text-3xl font-bold " +
                    (analysis.analysis.riskLevel === "HIGH"
                      ? "text-red-400"
                      : analysis.analysis.riskLevel === "MEDIUM"
                      ? "text-yellow-400"
                      : "text-green-400")
                  }
                >
                  {analysis.analysis.riskLevel}
                </h3>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Total Recibido</p>
                <h3 className="mt-4 text-3xl font-bold text-white">{analysis.totalReceivedBtc} BTC</h3>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Transacciones</p>
                <h3 className="mt-4 text-3xl font-bold text-cyan-300">{analysis.txCount}</h3>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
              <p className="text-sm text-gray-500">Direccion de Wallet</p>
              <p className="mt-4 break-all text-cyan-300">{analysis.wallet}</p>
            </div>

            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">
              <h2 className="text-2xl font-semibold text-red-300">Razones del Analisis</h2>
              <div className="mt-6 grid gap-4">
                {analysis.analysis.reasons.map((r: string, i: number) => (
                  <div key={i} className="rounded-2xl border border-white/5 bg-black/30 p-5">{r}</div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-8">
              <h2 className="text-2xl font-semibold text-cyan-300">Recomendacion</h2>
              <p className="mt-5 leading-8 text-gray-300">{analysis.analysis.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}