"use client";

import { useEffect, useState } from "react";

interface DecisionEvent {

  id: number;

  protocol: string;

  action: string;

  status: string;

}

export default function AutonomousDecisionEngine() {

  const [events, setEvents] =
    useState<DecisionEvent[]>([]);

  useEffect(() => {

    const protocols = [

      "AML Escalation Protocol",

      "Cyber Defense Response",

      "Blockchain Threat Isolation",

      "Public Corruption Intervention",

      "Quantum Threat Containment",

      "Global Risk Prioritization",

      "Autonomous Investigation Trigger",

      "Strategic Infrastructure Protection",

    ];

    const actions = [

      "AI agents deployed",

      "Risk escalation executed",

      "Neural investigation activated",

      "Threat mitigation protocol initiated",

      "Global alert synchronization completed",

      "Autonomous response validated",

      "Strategic containment executed",

      "Predictive defense activated",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          protocol:
            protocols[
              Math.floor(
                Math.random() *
                  protocols.length
              )
            ],

          action:
            actions[
              Math.floor(
                Math.random() *
                  actions.length
              )
            ],

          status:
            Math.random() > 0.5
              ? "EXECUTED"
              : "PROCESSING",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 14),

        ]);

      }, 1700);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        AUTONOMOUS DECISION ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        Autonomous strategic intelligence orchestration system

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            AI DECISIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            4.8M

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            ACTIVE PROTOCOLS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            924

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            AGENT COORDINATION

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            LIVE

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AUTONOMY LEVEL

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            MAXIMUM

          </h2>

        </div>

      </div>

      {/* CORE */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-7xl font-black text-cyan-400/20">

                A.D.E

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                AUTONOMOUS STRATEGIC CORE

              </p>

            </div>

          </div>

          {/* CORE NODES */}

          <div className="absolute left-[18%] top-[30%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan]" />

          <div className="absolute left-[42%] top-[66%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_30px_red]" />

          <div className="absolute left-[68%] top-[26%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_30px_yellow]" />

          <div className="absolute left-[82%] top-[74%] h-5 w-5 rounded-full bg-green-400 shadow-[0_0_30px_green]" />

        </div>

      </div>

      {/* EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          AUTONOMOUS EXECUTION EVENTS

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

                    {event.protocol}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.action}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    event.status ===
                    "EXECUTED"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {event.status}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

