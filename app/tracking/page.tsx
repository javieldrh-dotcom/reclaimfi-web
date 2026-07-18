"use client";

import { useState } from "react";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function TrackingPage() {

  const [wallet, setWallet] = useState("");
  const [data, setData] = useState<any>(null);

  function analyzeWallet() {

    if (!wallet) {
      alert("Enter wallet address");
      return;
    }

    let risk = "Low";
    let behavior = "Normal";
    let activity = "Operational";
    let connections = 4;

    let timeline = [
      "Initial wallet creation detected",
      "Standard transaction flow observed",
      "No suspicious layering patterns"
    ];

    if (wallet.toLowerCase().includes("risk")) {

      risk = "Critical";
      behavior = "Obfuscation";
      activity = "Mixer Exposure";
      connections = 28;

      timeline = [
        "Mixer interaction detected",
        "Cross-chain transfers identified",
        "Rapid velocity transaction pattern",
        "Wallet clustering anomalies observed",
        "High-risk routing exposure"
      ];

    } else if (
      wallet.toLowerCase().includes("review")
    ) {

      risk = "Medium";
      behavior = "Unusual";
      activity = "Compliance Review";
      connections = 12;

      timeline = [
        "Unusual offshore routing detected",
        "Behavior inconsistent with historical profile",
        "Moderate anomaly score generated"
      ];

    }

    setData({
      wallet: wallet,
      risk: risk,
      behavior: behavior,
      activity: activity,
      connections: connections,
      timeline: timeline
    });

  }

  return (

    <main className="min-h-screen bg-black text-white p-10 relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold text-cyan-400">
              Wallet Tracking Center
            </h1>

            <p className="mt-4 text-gray-500">
              Blockchain tracing, wallet behavior and forensic intelligence.
            </p>

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            TRACKING ENGINE
          </div>

        </div>

        {/* INPUT */}
        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">

          <h2 className="text-2xl font-semibold">
            Wallet Intelligence Analysis
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
              className="rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300"
            >
              Track Wallet
            </button>

          </div>

        </div>

        {/* RESULTS */}
        {data && (

          <div className="mt-10 grid gap-8">

            {/* CARDS */}
            <div className="grid gap-6 md:grid-cols-4">

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Risk Level
                </p>

                <h2
                  className={
                    "mt-4 text-4xl font-bold " +

                    (data.risk === "Critical"
                      ? "text-red-400"
                      : data.risk === "Medium"
                      ? "text-yellow-400"
                      : "text-green-400")
                  }
                >
                  {data.risk}
                </h2>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Behavior
                </p>

                <h2 className="mt-4 text-3xl font-bold text-cyan-300">
                  {data.behavior}
                </h2>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Activity
                </p>

                <h2 className="mt-4 text-3xl font-bold text-white">
                  {data.activity}
                </h2>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Connections
                </p>

                <h2 className="mt-4 text-4xl font-bold text-cyan-400">
                  {data.connections}
                </h2>

              </div>

            </div>

            {/* WALLET */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">

              <p className="text-sm text-gray-500">
                Wallet Address
              </p>

              <p className="mt-4 break-all text-cyan-300">
                {data.wallet}
              </p>

            </div>

            {/* TIMELINE */}
            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">

              <h2 className="text-2xl font-semibold text-red-300">
                Behavioral Timeline
              </h2>

              <div className="mt-6 grid gap-4">

                {data.timeline.map((item: string, index: number) => (

                  <div
                    key={index}
                    className="rounded-2xl border border-white/5 bg-black/30 p-5"
                  >
                    {item}
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
                  data.risk === "Critical"
                  ? "Escalate wallet immediately for forensic investigation and AML tracing."
                  : data.risk === "Medium"
                  ? "Compliance review and transaction validation recommended."
                  : "Wallet activity remains within acceptable operational thresholds."
                }

              </p>

            </div>

          </div>

        )}

      </div>

    </main>

  );
}

