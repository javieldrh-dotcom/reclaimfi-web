"use client";

import { useEffect, useState } from "react";

interface SanctionItem {

  id: number;

  entity: string;

  country: string;

  category: string;

  status: string;

}

export default function SanctionsEngine() {

  const [items, setItems] =
    useState<SanctionItem[]>([]);

  useEffect(() => {

    const entities = [

      "Crypto Wallet Cluster",
      "Offshore Petroleum Group",
      "Government Contractor",
      "International Trading Company",
      "Public Infrastructure Fund",
      "Sports Financial Entity",
      "Film Investment Group",
      "Petrochemical Network",

    ];

    const countries = [

      "Russia",
      "Iran",
      "North Korea",
      "Syria",
      "Venezuela",
      "China",
      "United Arab Emirates",

    ];

    const categories = [

      "OFAC",

      "PEP",

      "FATF",

      "AML",

      "Sanctioned Entity",

      "Geopolitical Risk",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          entity:
            entities[
              Math.floor(
                Math.random() *
                  entities.length
              )
            ],

          country:
            countries[
              Math.floor(
                Math.random() *
                  countries.length
              )
            ],

          category:
            categories[
              Math.floor(
                Math.random() *
                  categories.length
              )
            ],

          status:
            Math.random() > 0.5
              ? "HIGH RISK"
              : "MONITOR",

        };

        setItems((prev) => [

          item,
          ...prev.slice(0, 9),

        ]);

      }, 2500);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        OFAC & SANCTIONS ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        Global sanctions, geopolitical & compliance intelligence

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            SANCTIONED ENTITIES

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            18K+

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            3,291

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            PEP DETECTIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            842

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            COMPLIANCE

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            ACTIVE

          </h2>

        </div>

      </div>

      {/* LIVE SANCTIONS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE SANCTIONS MONITOR

        </h2>

        <div className="space-y-4">

          {items.map((item) => (

            <div
              key={item.id}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {item.entity}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {item.country}
                    {" • "}
                    {item.category}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    item.status ===
                    "HIGH RISK"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {item.status}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

