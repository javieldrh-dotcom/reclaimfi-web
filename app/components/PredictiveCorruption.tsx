"use client";

import { useEffect, useState } from "react";

interface CorruptionEvent {

  id: number;

  institution: string;

  anomaly: string;

  probability: string;

}

export default function PredictiveCorruption() {

  const [events, setEvents] =
    useState<CorruptionEvent[]>([]);

  useEffect(() => {

    const institutions = [

      "Municipal Government",

      "Public Hospital",

      "State Oil Company",

      "Public University",

      "Infrastructure Ministry",

      "Transportation Agency",

      "Public Procurement Office",

      "Tax Authority",

      "Governor Office",

      "Municipal Treasury",

    ];

    const anomalies = [

      "Abnormal contract inflation detected",

      "Procurement anomaly identified",

      "Repeated vendor concentration",

      "Potential shell company correlation",

      "Budgetary deviation pattern",

      "Unusual payment routing",

      "Cross-border financial anomaly",

      "AI corruption probability spike",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          institution:
            institutions[
              Math.floor(
                Math.random() *
                  institutions.length
              )
            ],

          anomaly:
            anomalies[
              Math.floor(
                Math.random() *
                  anomalies.length
              )
            ],

          probability:
            Math.random() > 0.5
              ? "92%"
              : "78%",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 9),

        ]);

      }, 2400);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        PREDICTIVE CORRUPTION ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        AI institutional corruption prediction system

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK CASES

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            482

          </h2>

        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            INSTITUTIONS ANALYZED

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            12K+

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AI PREDICTIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            94%

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            ACTIVE MONITORING

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            LIVE

          </h2>

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE CORRUPTION PREDICTIONS

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

                    {event.institution}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.anomaly}

                  </p>

                </div>

                <span className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400">

                  {event.probability}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

