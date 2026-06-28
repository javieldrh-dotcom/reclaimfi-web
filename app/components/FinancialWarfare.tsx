"use client";

import { useEffect, useState } from "react";

interface WarfareEvent {

  id: number;

  entity: string;

  operation: string;

  level: string;

}

export default function FinancialWarfare() {

  const [events, setEvents] =
    useState<WarfareEvent[]>([]);

  useEffect(() => {

    const entities = [

      "Offshore Banking Network",

      "International Trade Corridor",

      "Sanctioned Financial Entity",

      "Global Energy Consortium",

      "Cross-border Tax Structure",

      "Strategic Investment Fund",

      "Cryptocurrency Liquidity Hub",

      "State Financial Infrastructure",

    ];

    const operations = [

      "Potential sanctions evasion detected",

      "Offshore routing correlation identified",

      "High-risk capital movement analyzed",

      "Cross-border laundering structure mapped",

      "Strategic economic anomaly detected",

      "Institutional financial exposure identified",

      "AI trade manipulation prediction triggered",

      "Global liquidity anomaly propagated",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          entity:
            entities[
              Math.floor(
                Math.random() *
                  entities.length
              )
            ],

          operation:
            operations[
              Math.floor(
                Math.random() *
                  operations.length
              )
            ],

          level:
            Math.random() > 0.5
              ? "CRITICAL"
              : "HIGH",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 14),

        ]);

      }, 1600);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        GLOBAL FINANCIAL WARFARE ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        Strategic economic intelligence and financial warfare analysis system

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            GLOBAL THREATS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            12,842

          </h2>

        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            OFFSHORE NETWORKS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            4,218

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            LIVE ANALYSIS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            ACTIVE

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            ECONOMIC INTEL

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            GLOBAL

          </h2>

        </div>

      </div>

      {/* CORE */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-7xl font-black text-cyan-400/20">

                F.W.E

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                GLOBAL ECONOMIC INTELLIGENCE

              </p>

            </div>

          </div>

          {/* NODES */}

          <div className="absolute left-[20%] top-[28%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_30px_red]" />

          <div className="absolute left-[42%] top-[66%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan]" />

          <div className="absolute left-[68%] top-[24%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_30px_yellow]" />

          <div className="absolute left-[84%] top-[74%] h-5 w-5 rounded-full bg-green-400 shadow-[0_0_30px_green]" />

        </div>

      </div>

      {/* EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE ECONOMIC THREATS

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

                    {event.entity}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.operation}

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

