"use client";

import { useEffect, useState } from "react";

interface AIEvent {

  id: number;

  title: string;

  description: string;

  priority: string;

}

export default function AutonomousAI() {

  const [events, setEvents] =
    useState<AIEvent[]>([]);

  useEffect(() => {

    const titles = [

      "Hidden wallet correlation detected",

      "Potential public corruption network",

      "Cross-border laundering pattern",

      "Darknet transaction linkage",

      "Sanctioned entity interaction",

      "Government contractor anomaly",

      "Blockchain forensic alert",

      "Suspicious AML behavior",

    ];

    const descriptions = [

      "AI identified transactional similarities between unrelated wallets.",

      "Multiple entities linked through hidden financial relationships.",

      "Cross-chain movements indicate possible laundering activity.",

      "Behavioral pattern resembles previously detected illicit operations.",

      "Public institution linked to suspicious financial movement.",

      "AI neural engine found abnormal procurement correlation.",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          title:
            titles[
              Math.floor(
                Math.random() *
                  titles.length
              )
            ],

          description:
            descriptions[
              Math.floor(
                Math.random() *
                  descriptions.length
              )
            ],

          priority:
            Math.random() > 0.5
              ? "CRITICAL"
              : "HIGH",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 8),

        ]);

      }, 2600);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        AUTONOMOUS AI INVESTIGATOR

      </h1>

      <p className="mt-4 text-gray-400">

        Neural autonomous forensic intelligence system

      </p>

      {/* STATUS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            AI STATUS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            ACTIVE

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            CRITICAL CASES

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            214

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            ACTIVE INVESTIGATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            1,842

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            AI CORRELATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            98K+

          </h2>

        </div>

      </div>

      {/* LIVE AI EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE AUTONOMOUS INVESTIGATIONS

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

                    {event.title}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.description}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    event.priority ===
                    "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
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

