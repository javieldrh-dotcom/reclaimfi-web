"use client";

import { useEffect, useState } from "react";

interface MeshEvent {

  id: number;

  source: string;

  target: string;

  message: string;

}

export default function IntelligenceMesh() {

  const [events, setEvents] =
    useState<MeshEvent[]>([]);

  useEffect(() => {

    const agents = [

      "AML Agent",

      "Blockchain Agent",

      "Darknet Agent",

      "Tax Agent",

      "Cybersecurity Agent",

      "Corruption Agent",

      "Sanctions Agent",

      "Predictive AI",

    ];

    const messages = [

      "Correlation established",

      "Risk synchronization completed",

      "Threat intelligence shared",

      "Wallet anomaly propagated",

      "Suspicious entity transmitted",

      "Behavioral analysis synchronized",

      "Cross-agent verification completed",

      "Neural intelligence updated",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          source:
            agents[
              Math.floor(
                Math.random() *
                  agents.length
              )
            ],

          target:
            agents[
              Math.floor(
                Math.random() *
                  agents.length
              )
            ],

          message:
            messages[
              Math.floor(
                Math.random() *
                  messages.length
              )
            ],

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 11),

        ]);

      }, 1800);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        REAL-TIME INTELLIGENCE MESH

      </h1>

      <p className="mt-4 text-gray-400">

        Distributed neural intelligence synchronization network

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ACTIVE NODES

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            4,812

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            LIVE SYNCHRONIZATION

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            ONLINE

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            THREAT FLOWS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            28K+

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AI COMMUNICATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            LIVE

          </h2>

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE AGENT SYNCHRONIZATION

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

                    {event.source}
                    {" → "}
                    {event.target}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.message}

                  </p>

                </div>

                <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-300">

                  SYNC

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

