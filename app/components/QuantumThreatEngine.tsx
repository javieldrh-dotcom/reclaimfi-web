"use client";

import { useEffect, useState } from "react";

interface ThreatEvent {

  id: number;

  vector: string;

  anomaly: string;

  level: string;

}

export default function QuantumThreatEngine() {

  const [events, setEvents] =
    useState<ThreatEvent[]>([]);

  useEffect(() => {

    const vectors = [

      "Blockchain Network",

      "Global Banking Grid",

      "Darknet Infrastructure",

      "Tax Intelligence Matrix",

      "Cyber Warfare Layer",

      "Institutional Corruption Cluster",

      "AML Neural System",

      "Quantum Intelligence Core",

    ];

    const anomalies = [

      "Quantum anomaly correlation detected",

      "Multi-dimensional threat pattern identified",

      "Neural behavioral divergence",

      "Autonomous risk escalation",

      "Predictive attack simulation triggered",

      "High-frequency anomaly spike",

      "Cross-system threat propagation",

      "AI threat evolution detected",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          vector:
            vectors[
              Math.floor(
                Math.random() *
                  vectors.length
              )
            ],

          anomaly:
            anomalies[
              Math.floor(
                Math.random() *
                  anomalies.length
              )
            ],

          level:
            Math.random() > 0.5
              ? "CRITICAL"
              : "SEVERE",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 13),

        ]);

      }, 1600);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        QUANTUM THREAT DETECTION ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        Next-generation multi-dimensional threat intelligence system

      </p>

      {/* STATUS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            CRITICAL THREATS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            9,482

          </h2>

        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            QUANTUM ANALYSIS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            ACTIVE

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AI CORRELATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            84M+

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            GLOBAL PREDICTIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            LIVE

          </h2>

        </div>

      </div>

      {/* CORE */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-7xl font-black text-cyan-400/20">

                Q-CORE

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                QUANTUM THREAT MATRIX

              </p>

            </div>

          </div>

          {/* QUANTUM NODES */}

          <div className="absolute left-[20%] top-[30%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_30px_red]" />

          <div className="absolute left-[40%] top-[62%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan]" />

          <div className="absolute left-[65%] top-[22%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_30px_yellow]" />

          <div className="absolute left-[84%] top-[70%] h-5 w-5 rounded-full bg-green-400 shadow-[0_0_30px_green]" />

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE QUANTUM THREATS

        </h2>

        <div className="space-y-4">

          {events.map((event) => (

            <div
              key={event.id}
              className="rounded-lg border border-red-500/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {event.vector}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.anomaly}

                  </p>

                </div>

                <span className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400">

                  {event.level}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

