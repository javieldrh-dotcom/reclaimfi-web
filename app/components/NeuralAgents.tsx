"use client";

import { useEffect, useState } from "react";

interface Agent {

  id: number;

  name: string;

  task: string;

  status: string;

}

export default function NeuralAgents() {

  const [agents, setAgents] =
    useState<Agent[]>([]);

  useEffect(() => {

    const names = [

      "AML Agent",

      "Tax Intelligence Agent",

      "Cybersecurity Agent",

      "Blockchain Agent",

      "Darknet Agent",

      "Public Corruption Agent",

      "Sanctions Agent",

      "Predictive AI Agent",

    ];

    const tasks = [

      "Analyzing suspicious wallet activity",

      "Scanning global tax anomalies",

      "Monitoring ransomware infrastructure",

      "Tracking blockchain correlations",

      "Detecting illicit financial flows",

      "Evaluating geopolitical risks",

      "Cross-checking sanctions exposure",

      "Generating predictive intelligence",

    ];

    const interval =
      setInterval(() => {

        const item = {

          id: Date.now(),

          name:
            names[
              Math.floor(
                Math.random() *
                  names.length
              )
            ],

          task:
            tasks[
              Math.floor(
                Math.random() *
                  tasks.length
              )
            ],

          status:
            Math.random() > 0.5
              ? "ACTIVE"
              : "PROCESSING",

        };

        setAgents((prev) => [

          item,
          ...prev.slice(0, 7),

        ]);

      }, 2200);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        MULTI-AGENT NEURAL AGI

      </h1>

      <p className="mt-4 text-gray-400">

        Autonomous distributed intelligence ecosystem

      </p>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ACTIVE AGENTS

          </p>

          <h2 className="mt-4 text-3xl font-black text-cyan-300">

            128

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-green-400">

            AI TASKS

          </p>

          <h2 className="mt-4 text-3xl font-black text-green-400">

            48K+

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-red-400">

            THREATS DETECTED

          </p>

          <h2 className="mt-4 text-3xl font-black text-red-400">

            2,481

          </h2>

        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-6">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            AGI STATUS

          </p>

          <h2 className="mt-4 text-3xl font-black text-yellow-400">

            ONLINE

          </h2>

        </div>

      </div>

      {/* LIVE AGENTS */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE AGENT OPERATIONS

        </h2>

        <div className="space-y-4">

          {agents.map((agent) => (

            <div
              key={agent.id}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-5"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-white">

                    {agent.name}

                  </h3>

                  <p className="mt-2 text-sm text-gray-400">

                    {agent.task}

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    agent.status ===
                    "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >

                  {agent.status}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

