"use client";

import { useEffect, useState } from "react";

interface CountryRisk {

  country: string;

  risk: string;

  sector: string;

}

export default function GlobalRiskMap() {

  const [risks, setRisks] =
    useState<CountryRisk[]>([]);

  useEffect(() => {

    const countries = [

      "United States",
      "Brazil",
      "Germany",
      "France",
      "Russia",
      "China",
      "Japan",
      "South Africa",
      "Iran",
      "Venezuela",
      "Australia",
      "India",

    ];

    const sectors = [

      "AML",

      "Cybersecurity",

      "Tax Evasion",

      "Public Corruption",

      "Darknet Activity",

      "Sanctions",

      "Blockchain Risk",

    ];

    const interval =
      setInterval(() => {

        const item = {

          country:
            countries[
              Math.floor(
                Math.random() *
                  countries.length
              )
            ],

          sector:
            sectors[
              Math.floor(
                Math.random() *
                  sectors.length
              )
            ],

          risk:
            Math.random() > 0.5
              ? "HIGH"
              : "MEDIUM",

        };

        setRisks((prev) => [

          item,
          ...prev.slice(0, 10),

        ]);

      }, 2500);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        GLOBAL RISK MAP

      </h1>

      <p className="mt-4 text-gray-400">

        Worldwide intelligence risk visualization engine

      </p>

      {/* MAP */}

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="relative h-[500px] overflow-hidden rounded-xl border border-cyan-400/10 bg-[#020617]">

          {/* SIMULATED WORLD MAP */}

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <h2 className="text-7xl font-black text-cyan-400/20">

                🌍

              </h2>

              <p className="mt-6 text-xl text-cyan-300">

                LIVE GLOBAL INTELLIGENCE MAP

              </p>

            </div>

          </div>

          {/* RISK PINGS */}

          <div className="absolute left-[20%] top-[30%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_25px_red]" />

          <div className="absolute left-[60%] top-[20%] h-5 w-5 rounded-full bg-yellow-400 shadow-[0_0_25px_yellow]" />

          <div className="absolute left-[75%] top-[60%] h-5 w-5 rounded-full bg-red-500 shadow-[0_0_25px_red]" />

          <div className="absolute left-[35%] top-[70%] h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_25px_cyan]" />

        </div>

      </div>

      {/* LIVE RISKS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE GLOBAL EVENTS

        </h2>

        <div className="space-y-4">

          {risks.map((item, index) => (

            <div
              key={index}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {item.country}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {item.sector}

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

