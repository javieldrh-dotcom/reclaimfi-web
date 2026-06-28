"use client";

import { useEffect, useState } from "react";

interface EntityNode {

  id: number;

  name: string;

  type: string;

  risk: string;

}

export default function EntityCorrelation() {

  const [nodes, setNodes] =
    useState<EntityNode[]>([]);

  useEffect(() => {

    const entities = [

      {
        name: "Binance Wallet",
        type: "Wallet",
      },

      {
        name: "State Oil Company",
        type: "Public Entity",
      },

      {
        name: "Offshore Corporation",
        type: "Company",
      },

      {
        name: "Government Contractor",
        type: "Contractor",
      },

      {
        name: "Petrochemical Group",
        type: "Enterprise",
      },

      {
        name: "Sports Federation",
        type: "Sports",
      },

      {
        name: "Film Production Fund",
        type: "Cinema",
      },

      {
        name: "Agricultural Exporter",
        type: "Food Production",
      },

    ];

    const interval =
      setInterval(() => {

        const entity =
          entities[
            Math.floor(
              Math.random() *
                entities.length
            )
          ];

        const item = {

          id: Date.now(),

          name: entity.name,

          type: entity.type,

          risk:
            Math.random() > 0.5
              ? "HIGH"
              : "MEDIUM",

        };

        setNodes((prev) => [

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

        ENTITY CORRELATION ENGINE

      </h1>

      <p className="mt-4 text-gray-400">

        AI-powered relationship & network intelligence

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ENTITIES

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            84K+

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            RELATIONS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            1.2M

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            1,482

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

      {/* ENTITY NETWORK */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE ENTITY NETWORK

        </h2>

        <div className="space-y-4">

          {nodes.map((node) => (

            <div
              key={node.id}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {node.name}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {node.type}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    node.risk === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {node.risk}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

