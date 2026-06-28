"use client";

import { useEffect, useState } from "react";

interface MissionEvent {

  id: number;

  system: string;

  status: string;

  priority: string;

}

export default function MissionControl() {

  const [events, setEvents] =
    useState<MissionEvent[]>([]);

  useEffect(() => {

    const systems = [

      "Global AML Grid",

      "Cyber Defense Network",

      "Blockchain Intelligence",

      "Predictive Corruption Engine",

      "Darknet Monitoring",

      "Tax Intelligence System",

      "Autonomous AI Mesh",

      "Global Threat Matrix",

    ];

    const statuses = [

      "Operational",

      "Monitoring",

      "Threat Detected",

      "Analyzing",

      "Neural Sync Active",

      "Predictive Scan Running",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          system:
            systems[
              Math.floor(
                Math.random() *
                  systems.length
              )
            ],

          status:
            statuses[
              Math.floor(
                Math.random() *
                  statuses.length
              )
            ],

          priority:
            Math.random() > 0.5
              ? "HIGH"
              : "NORMAL",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 12),

        ]);

      }, 1700);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        ENTERPRISE MISSION CONTROL

      </h1>

      <p className="mt-4 text-gray-400">

        Centralized global intelligence operations command

      </p>

      {/* GLOBAL STATUS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            GLOBAL STATUS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            ONLINE

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            ACTIVE THREATS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            8,214

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            AGI AGENTS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            1,024

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            GLOBAL OPERATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            LIVE

          </h2>

        </div>

      </div>

      {/* CENTRAL DISPLAY */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-8xl font-black text-cyan-400/20">

                AGI

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                GLOBAL INTELLIGENCE CORE

              </p>

            </div>

          </div>

          {/* NEURAL NODES */}

          <div className="absolute left-[18%] top-[25%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan]" />

          <div className="absolute left-[42%] top-[60%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_30px_red]" />

          <div className="absolute left-[70%] top-[35%] h-5 w-5 rounded-full bg-green-400 shadow-[0_0_30px_green]" />

          <div className="absolute left-[82%] top-[72%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_30px_yellow]" />

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE GLOBAL OPERATIONS

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

                    {event.system}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.status}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    event.priority ===
                    "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >

                  {event.priority}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

