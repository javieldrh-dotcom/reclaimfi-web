"use client";

import { useEffect, useState } from "react";

interface AMLAlert {

  id: number;

  wallet: string;

  activity: string;

  risk: string;

  chain: string;

  timestamp: string;

}

export default function AMLEngine() {

  const [alerts, setAlerts] =
    useState<AMLAlert[]>([]);

  useEffect(() => {

    const activities = [

      "Mixer interaction detected",

      "Cross-chain laundering correlation",

      "Rapid asset fragmentation",

      "Sanctioned wallet proximity",

      "Behavioral AML anomaly",

      "Suspicious transaction burst",

      "Darknet wallet association",

      "High-risk exchange exposure",

      "Artificial transaction layering",

      "Suspicious bridge interaction",

    ];

    const chains = [

      "Bitcoin",

      "Ethereum",

      "BNB Chain",

      "Polygon",

      "Tron",

      "Solana",

    ];

    const risks = [

      "LOW",

      "MEDIUM",

      "HIGH",

      "CRITICAL",

    ];

    const interval =
      setInterval(() => {

        const wallet =
          "0x" +
          Math.random()
            .toString(16)
            .substring(2, 14)
            .toUpperCase();

        const alert: AMLAlert = {

          id: Date.now(),

          wallet,

          activity:
            activities[
              Math.floor(
                Math.random() *
                  activities.length
              )
            ],

          risk:
            risks[
              Math.floor(
                Math.random() *
                  risks.length
              )
            ],

          chain:
            chains[
              Math.floor(
                Math.random() *
                  chains.length
              )
            ],

          timestamp:
            new Date().toLocaleTimeString(),

        };

        setAlerts((prev) => [

          alert,
          ...prev.slice(0, 11),

        ]);

      }, 2400);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      {/* HEADER */}

      <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(250,204,21,0.08)]">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black text-yellow-300">

              AML INTELLIGENCE ENGINE

            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">

              Advanced anti-money laundering intelligence center
              for blockchain tracing,
              suspicious activity monitoring,
              sanctions screening,
              transaction correlation,
              and cross-chain forensic analysis.

            </p>

          </div>

          <div className="rounded-3xl border border-yellow-500/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(250,204,21,0.15)]">

            <p className="text-xs tracking-[0.35em] text-yellow-400">

              AML STATUS

            </p>

            <h2 className="mt-4 text-5xl font-black text-yellow-300">

              ACTIVE

            </h2>

          </div>

        </div>

      </div>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            MONITORED WALLETS

          </p>

          <h2 className="mt-5 text-6xl font-black text-yellow-300">

            18K

          </h2>

        </div>

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-5 text-6xl font-black text-red-300">

            93

          </h2>

        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            CROSS-CHAIN

          </p>

          <h2 className="mt-5 text-6xl font-black text-cyan-300">

            412

          </h2>

        </div>

        <div className="rounded-3xl border border-green-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-green-400">

            COMPLIANCE SCORE

          </p>

          <h2 className="mt-5 text-6xl font-black text-green-300">

            97%

          </h2>

        </div>

      </div>

      {/* RISK MATRIX */}

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-red-300">

            SANCTIONS EXPOSURE

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[72%] rounded-full bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Elevated sanctioned interaction risk

            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-yellow-300">

            MIXER ACTIVITY

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[58%] rounded-full bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Mixer exposure monitored

            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-cyan-300">

            AI CORRELATION

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[96%] rounded-full bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Autonomous tracing operational

            </p>

          </div>

        </div>

      </div>

      {/* LIVE ALERT STREAM */}

      <div className="mt-10 rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-black text-yellow-300">

              LIVE AML STREAM

            </h2>

            <p className="mt-3 text-gray-500">

              Realtime blockchain forensic telemetry

            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-400" />

            <span className="text-sm font-black tracking-[0.25em] text-yellow-300">

              REALTIME

            </span>

          </div>

        </div>

        {/* ALERTS */}

        <div className="mt-10 space-y-5">

          {alerts.map((alert) => (

            <div
              key={alert.id}
              className="rounded-2xl border border-yellow-500/10 bg-black/30 p-6 transition-all hover:border-yellow-400/20 hover:bg-yellow-500/5"
            >

              <div className="flex items-center justify-between">

                {/* LEFT */}

                <div>

                  <div className="flex items-center gap-4">

                    <span className="rounded-full bg-yellow-500/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-yellow-300">

                      {alert.chain}

                    </span>

                    <span className="text-sm text-gray-500">

                      {alert.timestamp}

                    </span>

                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">

                    {alert.activity}

                  </h3>

                  <p className="mt-3 text-sm text-gray-400">

                    Wallet:
                    {" "}
                    {alert.wallet}

                  </p>

                </div>

                {/* RIGHT */}

                <div>

                  <span className={`rounded-full px-5 py-3 text-xs font-black tracking-[0.2em] ${
                    alert.risk ===
                    "CRITICAL"
                      ? "bg-red-500/20 text-red-300"

                      : alert.risk ===
                        "HIGH"
                      ? "bg-orange-500/20 text-orange-300"

                      : alert.risk ===
                        "MEDIUM"
                      ? "bg-yellow-500/20 text-yellow-300"

                      : "bg-green-500/20 text-green-300"
                  }`}>

                    {alert.risk}

                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

