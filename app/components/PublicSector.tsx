"use client";

import { useEffect, useState } from "react";

interface PublicAlert {

  id: number;

  institution: string;

  country: string;

  risk: string;

}

export default function PublicSector() {

  const [alerts, setAlerts] =
    useState<PublicAlert[]>([]);

  useEffect(() => {

    const institutions = [

      "Ministry of Finance",
      "Municipal Government",
      "Public Hospital",
      "State Oil Company",
      "National University",
      "Public Infrastructure Agency",
      "Tax Administration",
      "State Petrochemical Corporation",
      "Transportation Authority",
      "General Comptroller",

    ];

    const countries = [

      "United States",
      "Brazil",
      "Germany",
      "France",
      "Japan",
      "Canada",
      "Australia",
      "South Africa",

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

          country:
            countries[
              Math.floor(
                Math.random() *
                  countries.length
              )
            ],

          risk:
            Math.random() > 0.5
              ? "HIGH"
              : "MEDIUM",

        };

        setAlerts((prev) => [

          item,
          ...prev.slice(0, 8),

        ]);

      }, 3000);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        PUBLIC SECTOR INTELLIGENCE

      </h1>

      <p className="mt-4 text-gray-400">

        Government forensic intelligence & anti-corruption engine

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            GOVERNMENTS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            190+

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            PUBLIC ENTITIES

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            12K+

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            312

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AI STATUS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            ACTIVE

          </h2>

        </div>

      </div>

      {/* LIVE ALERTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE PUBLIC ALERTS

        </h2>

        <div className="space-y-4">

          {alerts.map((item) => (

            <div
              key={item.id}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {item.institution}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {item.country}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    item.risk === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {item.risk}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

