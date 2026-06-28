"use client";

import { useEffect, useState } from "react";

interface AIEvent {

  id: number;

  title: string;

  risk: string;

  confidence: number;

}

export default function AIEngine() {

  const [events, setEvents] =
    useState<AIEvent[]>([]);

  useEffect(() => {

    const titles = [

      "Behavioral anomaly detected",

      "Cross-chain laundering pattern identified",

      "Suspicious mixer interaction detected",

      "High-frequency transaction activity",

      "Wallet clustering correlation",

      "AML deviation identified",

      "Sanctions exposure detected",

      "Risk escalation detected",

    ];

    const interval =
      setInterval(() => {

        const event = {

          id: Date.now(),

          title:
            titles[
              Math.floor(
                Math.random() *
                  titles.length
              )
            ],

          risk:
            Math.random() > 0.5
              ? "HIGH"
              : "MEDIUM",

          confidence:
            Math.floor(
              70 +
              Math.random() * 29
            ),

        };

        setEvents((prev) => [

          event,
          ...prev.slice(0, 6),

        ]);

      }, 3000);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        AI ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        AI-assisted operational analytics and anomaly detection.

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            AI STATUS

          </p>

          <h2 className="mt-4 text-4xl font-black text-cyan-300">

            ACTIVE

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-green-400">

            MONITORED ENTITIES

          </p>

          <h2 className="mt-4 text-4xl font-black text-green-400">

            4,283

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK FLAGS

          </p>

          <h2 className="mt-4 text-4xl font-black text-red-400">

            91

          </h2>

        </div>

      </div>

      {/* LIVE ANALYSIS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE AI ANALYSIS

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

                    Confidence:
                    {" "}
                    {event.confidence}%

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    event.risk === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {event.risk}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

