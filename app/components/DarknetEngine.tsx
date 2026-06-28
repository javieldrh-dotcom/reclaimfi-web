"use client";

import { useEffect, useState } from "react";

interface ThreatItem {

  id: number;

  source: string;

  category: string;

  threat: string;

  risk: string;

}

export default function DarknetEngine() {

  const [threats, setThreats] =
    useState<ThreatItem[]>([]);

  useEffect(() => {

    const sources = [

      "TOR Hidden Service",
      "Darknet Marketplace",
      "Ransomware Node",
      "Leaked Database",
      "Anonymous Crypto Mixer",
      "Cybercrime Forum",
      "Credential Dump",
      "Illicit Exchange",

    ];

    const categories = [

      "Ransomware",

      "Leaked Credentials",

      "Cyber Fraud",

      "Crypto Laundering",

      "Data Breach",

      "Illicit Marketplace",

    ];

    const alerts = [

      "Suspicious activity detected",

      "Potential financial laundering",

      "Credential exposure identified",

      "High-risk crypto movement",

      "Darknet transaction correlation",

      "Threat actor activity detected",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          source:
            sources[
              Math.floor(
                Math.random() *
                  sources.length
              )
            ],

          category:
            categories[
              Math.floor(
                Math.random() *
                  categories.length
              )
            ],

          threat:
            alerts[
              Math.floor(
                Math.random() *
                  alerts.length
              )
            ],

          risk:
            Math.random() > 0.5
              ? "CRITICAL"
              : "HIGH",

        };

        setThreats((prev) => [

          item,
          ...prev.slice(0, 9),

        ]);

      }, 2200);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        DARKNET INTELLIGENCE

      </h1>

      <p className="mt-4 text-gray-400">

        Cyber threat intelligence & darknet forensic monitoring

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            CRITICAL THREATS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            1,482

          </h2>

        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            DARKNET NODES

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            18K+

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            RANSOMWARE

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            ACTIVE

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            AI MONITORING

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            ONLINE

          </h2>

        </div>

      </div>

      {/* LIVE THREATS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE DARKNET THREATS

        </h2>

        <div className="space-y-4">

          {threats.map((item) => (

            <div
              key={item.id}
              className="rounded-lg border border-red-500/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {item.threat}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {item.source}
                    {" • "}
                    {item.category}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    item.risk ===
                    "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {item.risk}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

