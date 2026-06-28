"use client";

import { useEffect, useState } from "react";

interface GeoEvent {

  id: number;

  region: string;

  activity: string;

  severity: string;

}

export default function GeoIntelligence() {

  const [events, setEvents] =
    useState<GeoEvent[]>([]);

  useEffect(() => {

    const regions = [

      "North America",

      "South America",

      "Europe",

      "Middle East",

      "Africa",

      "Asia Pacific",

      "Eastern Europe",

      "Arctic Zone",

    ];

    const activities = [

      "Suspicious maritime activity",

      "Critical infrastructure anomaly",

      "Cross-border movement detected",

      "Satellite thermal anomaly",

      "Geospatial pattern identified",

      "High-risk territory alert",

      "Strategic asset monitoring",

      "Autonomous satellite correlation",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          region:
            regions[
              Math.floor(
                Math.random() *
                  regions.length
              )
            ],

          activity:
            activities[
              Math.floor(
                Math.random() *
                  activities.length
              )
            ],

          severity:
            Math.random() > 0.5
              ? "CRITICAL"
              : "ELEVATED",

        };

        setEvents((prev) => [

          item,
          ...prev.slice(0, 11),

        ]);

      }, 1900);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        SATELLITE & GEOINT INTELLIGENCE

      </h1>

      <p className="mt-4 text-gray-400">

        Geospatial and satellite intelligence operations system

      </p>

      {/* STATUS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            SATELLITES

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            214

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            CRITICAL EVENTS

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            1,924

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            LIVE TRACKING

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

            100%

          </h2>

        </div>

      </div>

      {/* GEO MAP */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-8xl font-black text-cyan-400/20">

                🛰

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                GLOBAL GEOINT NETWORK

              </p>

            </div>

          </div>

          {/* GEO NODES */}

          <div className="absolute left-[22%] top-[32%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_30px_red]" />

          <div className="absolute left-[48%] top-[58%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan]" />

          <div className="absolute left-[70%] top-[25%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_30px_yellow]" />

          <div className="absolute left-[82%] top-[72%] h-5 w-5 rounded-full bg-green-400 shadow-[0_0_30px_green]" />

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE GEOINT EVENTS

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

                    {event.region}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {event.activity}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    event.severity ===
                    "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {event.severity}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

