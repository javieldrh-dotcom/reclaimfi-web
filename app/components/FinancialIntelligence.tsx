"use client";

import { useEffect, useState } from "react";

interface FinancialEvent {

  id: number;

  entity: string;

  activity: string;

  amount: string;

  risk: string;

  timestamp: string;

}

export default function FinancialIntelligence() {

  const [events, setEvents] =
    useState<FinancialEvent[]>([]);

  useEffect(() => {

    const entities = [

      "PETROLEUM HOLDING",

      "GLOBAL PROCUREMENT LTD",

      "TREASURY OPERATIONS",

      "INFRASTRUCTURE GROUP",

      "OFFSHORE ENERGY CORP",

      "LATAM LOGISTICS",

      "INTERNATIONAL CONTRACTORS",

      "CORPORATE HOLDINGS",

    ];

    const activities = [

      "Unusual treasury dispersion detected",

      "Repeated fragmented transfers identified",

      "Cross-border operational anomaly",

      "Procurement deviation pattern detected",

      "Behavioral financial inconsistency",

      "High-volume offshore movement",

      "Potential layered transaction sequence",

      "Treasury concentration anomaly",

      "Irregular contractor payment cycle",

      "Unusual beneficiary correlation",

    ];

    const risks = [

      "LOW",

      "MEDIUM",

      "HIGH",

      "CRITICAL",

    ];

    const interval =
      setInterval(() => {

        const amount =
          "$ " +
          (
            Math.random() *
            9000000
          ).toFixed(2);

        const event: FinancialEvent = {

          id: Date.now(),

          entity:
            entities[
              Math.floor(
                Math.random() *
                  entities.length
              )
            ],

          activity:
            activities[
              Math.floor(
                Math.random() *
                  activities.length
              )
            ],

          amount,

          risk:
            risks[
              Math.floor(
                Math.random() *
                  risks.length
              )
            ],

          timestamp:
            new Date().toLocaleTimeString(),

        };

        setEvents((prev) => [

          event,
          ...prev.slice(0, 11),

        ]);

      }, 2600);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      {/* HEADER */}

      <div className="rounded-3xl border border-emerald-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(16,185,129,0.08)]">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black text-emerald-300">

              FINANCIAL INTELLIGENCE

            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">

              Enterprise financial intelligence engine
              for banking analytics,
              treasury monitoring,
              procurement intelligence,
              tax anomaly detection,
              operational risk analysis,
              and financial behavioral correlation.

            </p>

          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(16,185,129,0.15)]">

            <p className="text-xs tracking-[0.35em] text-emerald-400">

              FINANCIAL STATUS

            </p>

            <h2 className="mt-4 text-5xl font-black text-emerald-300">

              ACTIVE

            </h2>

          </div>

        </div>

      </div>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-3xl border border-emerald-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-emerald-400">

            MONITORED FLOWS

          </p>

          <h2 className="mt-5 text-6xl font-black text-emerald-300">

            24K

          </h2>

        </div>

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK EVENTS

          </p>

          <h2 className="mt-5 text-6xl font-black text-red-300">

            39

          </h2>

        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ACTIVE ENTITIES

          </p>

          <h2 className="mt-5 text-6xl font-black text-cyan-300">

            842

          </h2>

        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AI CORRELATIONS

          </p>

          <h2 className="mt-5 text-6xl font-black text-yellow-300">

            117

          </h2>

        </div>

      </div>

      {/* ANALYTICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-red-300">

            OPERATIONAL RISK

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[74%] rounded-full bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Elevated financial behavioral deviations

            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-yellow-300">

            TREASURY MONITORING

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[88%] rounded-full bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Treasury flows stabilized

            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-cyan-300">

            TAX INTELLIGENCE

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[93%] rounded-full bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Fiscal analytics operational

            </p>

          </div>

        </div>

      </div>

      {/* LIVE FINANCIAL STREAM */}

      <div className="mt-10 rounded-3xl border border-emerald-500/20 bg-[#0d1117]/95 p-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-black text-emerald-300">

              LIVE FINANCIAL STREAM

            </h2>

            <p className="mt-3 text-gray-500">

              Realtime financial intelligence telemetry

            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />

            <span className="text-sm font-black tracking-[0.25em] text-emerald-300">

              REALTIME

            </span>

          </div>

        </div>

        {/* EVENTS */}

        <div className="mt-10 space-y-5">

          {events.map((event) => (

            <div
              key={event.id}
              className="rounded-2xl border border-emerald-500/10 bg-black/30 p-6 transition-all hover:border-emerald-400/20 hover:bg-emerald-500/5"
            >

              <div className="flex items-center justify-between">

                {/* LEFT */}

                <div>

                  <div className="flex items-center gap-4">

                    <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-emerald-300">

                      {event.entity}

                    </span>

                    <span className="text-sm text-gray-500">

                      {event.timestamp}

                    </span>

                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">

                    {event.activity}

                  </h3>

                  <p className="mt-3 text-sm text-gray-400">

                    Amount:
                    {" "}
                    {event.amount}

                  </p>

                </div>

                {/* RIGHT */}

                <div>

                  <span className={`rounded-full px-5 py-3 text-xs font-black tracking-[0.2em] ${
                    event.risk ===
                    "CRITICAL"
                      ? "bg-red-500/20 text-red-300"

                      : event.risk ===
                        "HIGH"
                      ? "bg-orange-500/20 text-orange-300"

                      : event.risk ===
                        "MEDIUM"
                      ? "bg-yellow-500/20 text-yellow-300"

                      : "bg-green-500/20 text-green-300"
                  }`}>

                    {event.risk}

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

