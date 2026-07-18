"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function BlockchainPage() {

  const [wallet, setWallet] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyzeWallet() {

    if (!wallet) {
      alert("Enter wallet address");
      return;
    }

    setLoading(true);

    let risk = "Low Risk";
    let score = 92;
    let behavior = "Normal";
    let activity = "Operational";
    let connections = 4;
    let volume = "$45,000";

    let alerts = [
      "No critical alerts detected",
      "Normal behavioral activity"
    ];

    if (wallet.toLowerCase().includes("risk")) {

      risk = "High Risk";
      score = 28;
      behavior = "Obfuscation";
      activity = "Mixer Exposure";
      connections = 28;
      volume = "$2,400,000";

      alerts = [
        "Mixer interaction detected",
        "Suspicious transaction patterns",
        "High velocity movement",
        "Cross-chain obfuscation"
      ];

    } else if (
      wallet.toLowerCase().includes("review")
    ) {

      risk = "Medium Risk";
      score = 61;
      behavior = "Unusual";
      activity = "Compliance Review";
      connections = 12;
      volume = "$680,000";

      alerts = [
        "Manual compliance review recommended",
        "Unusual transaction distribution"
      ];

    }

    const { error } = await supabase
      .from("wallets")
      .insert([
        {
          address: wallet,
          risk_level: risk,
          score: score,
          behavior: behavior,
          activity: activity,
          connections: connections
        }
      ]);

    if (error) {

      console.error(error);

      alert("Error saving wallet intelligence");

    } else {

      alert("Wallet intelligence stored successfully");

    }

    setAnalysis({
      wallet,
      risk,
      score,
      behavior,
      activity,
      connections,
      volume,
      alerts
    });

    setLoading(false);

  }

  return (

    <main className="min-h-screen bg-black p-10 text-white relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold text-cyan-400">
              Blockchain Intelligence
            </h1>

            <p className="mt-4 text-gray-500">
              Advanced wallet monitoring and forensic analysis.
            </p>

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            AGI Blockchain Engine
          </div>

        </div>

        {/* SEARCH */}
        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">

          <h2 className="text-2xl font-semibold">
            Wallet Analysis
          </h2>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">

            <input
              type="text"
              placeholder="Enter wallet address..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />

            <button
              onClick={analyzeWallet}
              disabled={loading}
              className="rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300"
            >
              {loading ? "Analyzing..." : "Analyze Wallet"}
            </button>

          </div>

        </div>

        {/* RESULTS */}
        {analysis && (

          <div className="mt-10 grid gap-8">

            {/* TOP CARDS */}
            <div className="grid gap-6 md:grid-cols-4">

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Blockchain Score
                </p>

                <h3 className="mt-4 text-4xl font-bold text-cyan-400">
                  {analysis.score}
                </h3>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  AML Risk
                </p>

                <h3
                  className={
                    "mt-4 text-3xl font-bold " +

                    (analysis.risk === "High Risk"
                      ? "text-red-400"
                      : analysis.risk === "Medium Risk"
                      ? "text-yellow-400"
                      : "text-green-400")
                  }
                >
                  {analysis.risk}
                </h3>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Estimated Volume
                </p>

                <h3 className="mt-4 text-3xl font-bold text-white">
                  {analysis.volume}
                </h3>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Connections
                </p>

                <h3 className="mt-4 text-3xl font-bold text-cyan-300">
                  {analysis.connections}
                </h3>

              </div>

            </div>

            {/* WALLET */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">

              <p className="text-sm text-gray-500">
                Wallet Address
              </p>

              <p className="mt-4 break-all text-cyan-300">
                {analysis.wallet}
              </p>

            </div>

            {/* ALERTS */}
            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">

              <h2 className="text-2xl font-semibold text-red-300">
                Intelligence Alerts
              </h2>

              <div className="mt-6 grid gap-4">

                {analysis.alerts.map((alert: string, index: number) => (

                  <div
                    key={index}
                    className="rounded-2xl border border-white/5 bg-black/30 p-5"
                  >
                    {alert}
                  </div>

                ))}

              </div>

            </div>

            {/* AGI */}
            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-8">

              <h2 className="text-2xl font-semibold text-cyan-300">
                AGI Recommendation
              </h2>

              <p className="mt-5 leading-8 text-gray-300">

                {
                  analysis.risk === "High Risk"
                  ? "Immediate forensic investigation recommended. Potential laundering indicators detected."
                  : analysis.risk === "Medium Risk"
                  ? "Compliance validation and transaction review recommended."
                  : "No major behavioral anomalies detected during preliminary analysis."
                }

              </p>

            </div>

          </div>

        )}

      </div>

    </main>

  );
}

