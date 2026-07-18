"use client";

import { useState } from "react";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function IntelPage() {

  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<any>(null);

  function runAnalysis() {

    if (!scenario) {
      alert("Enter investigation context");
      return;
    }

    let classification = "Operational";
    let priority = "Low";
    let confidence = "94%";
    let recommendation = "";
    let anomalies = [];

    if (scenario.toLowerCase().includes("mixer")) {

      classification = "Potential Laundering";
      priority = "Critical";
      confidence = "98%";

      recommendation =
        "Immediate forensic tracing and enhanced AML review recommended.";

      anomalies = [
        "Mixer interaction detected",
        "Layering behavior observed",
        "Cross-chain obfuscation identified",
        "Transaction velocity inconsistent"
      ];

    } else if (
      scenario.toLowerCase().includes("offshore")
    ) {

      classification = "Compliance Review";
      priority = "Medium";
      confidence = "81%";

      recommendation =
        "Manual compliance escalation recommended.";

      anomalies = [
        "Offshore exposure",
        "Jurisdictional mismatch",
        "Unusual transfer distribution"
      ];

    } else {

      recommendation =
        "No critical intelligence anomalies detected.";

      anomalies = [
        "Behavior within acceptable parameters",
        "Normal operational activity"
      ];
    }

    setResult({
      classification: classification,
      priority: priority,
      confidence: confidence,
      recommendation: recommendation,
      anomalies: anomalies
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
              AGI Intelligence Center
            </h1>

            <p className="mt-4 text-gray-500">
              Autonomous financial intelligence and anomaly detection.
            </p>

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            AI Agent Layer
          </div>

        </div>

        {/* INPUT */}
        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">

          <h2 className="text-2xl font-semibold">
            Intelligence Analysis
          </h2>

          <textarea
            placeholder="Describe transaction behavior, investigation notes or AML concerns..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="mt-6 h-40 w-full rounded-2xl border border-white/10 bg-black/40 p-5 outline-none"
          />

          <button
            onClick={runAnalysis}
            className="mt-6 rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300"
          >
            Run AGI Analysis
          </button>

        </div>

        {/* RESULTS */}
        {result && (

          <div className="mt-10 grid gap-8">

            {/* TOP */}
            <div className="grid gap-6 md:grid-cols-3">

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Classification
                </p>

                <h3 className="mt-4 text-3xl font-bold text-cyan-300">
                  {result.classification}
                </h3>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Priority
                </p>

                <h3
                  className={
                    "mt-4 text-3xl font-bold " +

                    (result.priority === "Critical"
                      ? "text-red-400"
                      : result.priority === "Medium"
                      ? "text-yellow-400"
                      : "text-green-400")
                  }
                >
                  {result.priority}
                </h3>

              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">

                <p className="text-sm text-gray-500">
                  Confidence
                </p>

                <h3 className="mt-4 text-3xl font-bold text-white">
                  {result.confidence}
                </h3>

              </div>

            </div>

            {/* ANOMALIES */}
            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">

              <h2 className="text-2xl font-semibold text-red-300">
                Detected Anomalies
              </h2>

              <div className="mt-6 grid gap-4">

                {result.anomalies.map((item: string, index: number) => (

                  <div
                    key={index}
                    className="rounded-2xl border border-white/5 bg-black/30 p-5"
                  >
                    {item}
                  </div>

                ))}

              </div>

            </div>

            {/* RECOMMENDATION */}
            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-8">

              <h2 className="text-2xl font-semibold text-cyan-300">
                AGI Recommendation
              </h2>

              <p className="mt-5 leading-8 text-gray-300">
                {result.recommendation}
              </p>

            </div>

          </div>

        )}

      </div>

    </main>

  );
}

