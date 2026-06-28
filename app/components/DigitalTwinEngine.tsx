"use client";

import { useEffect, useState } from "react";

interface SimulationEvent {

  id: number;

  sector: string;

  simulation: string;

  impact: string;

}

export default function DigitalTwinEngine() {

  const [events, setEvents] =
    useState<SimulationEvent[]>([]);

  useEffect(() => {

    const sectors = [

      "Global Economy",

      "Energy Infrastructure",

      "Public Sector Governance",

      "Healthcare Systems",

      "Financial Institutions",

      "Transportation Networks",

      "Food Production Systems",

      "Cybersecurity Infrastructure",

    ];

    const simulations = [

      "Economic collapse simulation executed",

      "Tax pressure projection generated",

      "Institutional corruption model updated",

      "Strategic infrastructure stress test",

      "Global inflation prediction recalculated",

      "Autonomous geopolitical simulation completed",

      "Public spending anomaly projected",

      "Supply chain disruption analyzed",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          sector:
            sectors[
              Math.floor(
                Math.random() *
                  sectors.length
              )
            ],

          simulation:
            simulations[
              Math.floor(
                Math.random() *
                  simulations.length
              )
            ],

          impact:
            Math.random() > 0.5
              ? "HIGH IMPACT"
              : "MODERATE",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 13),

        ]);

      }, 1800);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        GLOBAL DIGITAL TWIN ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        Planetary-scale strategic simulation and predictive modeling system

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ACTIVE SIMULATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            48,204

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            RISK MODELS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            9,842

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            LIVE PREDICTIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            ACTIVE

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            GLOBAL COVERAGE

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            PLANETARY

          </h2>

        </div>

      </div>

      {/* DIGITAL CORE */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-7xl font-black text-cyan-400/20">

                DIGITAL TWIN

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                STRATEGIC PLANETARY MODEL

              </p>

            </div>

          </div>

          {/* DIGITAL NODES */}

          <div className="absolute left-[20%] top-[25%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan]" />

          <div className="absolute left-[40%] top-[65%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_30px_red]" />

          <div className="absolute left-[70%] top-[35%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_30px_yellow]" />

          <div className="absolute left-[84%] top-[74%] h-5 w-5 rounded-full bg-green-400 shadow-[0_0_30px_green]" />

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE GLOBAL SIMULATIONS

        </h2>

        <div className="space-y-4">

          {events.map((event) => (

            <div
              key={event.id}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {event.sector}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.simulation}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    event.impact ===
                    "HIGH IMPACT"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {event.impact}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

