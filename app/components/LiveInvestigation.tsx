"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Investigation {

  id: number;

  case_id: string;

  target: string;

  status: string;

  created_at: string;

}

export default function LiveInvestigation() {

  const [input, setInput] =
    useState("");

  const [cases, setCases] =
    useState<Investigation[]>([]);

  const generateCaseId = () => {

    const random =
      Math.floor(
        100000 + Math.random() * 900000
      );

    return `AGI-2026-${random}`;

  };

  const loadCases = async () => {

    const { data } =
      await supabase
        .from("investigations")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (data) {

      setCases(data);

    }

  };

  useEffect(() => {

    loadCases();

  }, []);

  const startInvestigation =
    async () => {

      if (!input) {

        alert(
          "Enter Wallet / Hash"
        );

        return;

      }

      const caseId =
        generateCaseId();

      await supabase
        .from("investigations")
        .insert([
          {
            case_id: caseId,
            target: input,
            status: "ACTIVE",
          },
        ]);

      setInput("");

      loadCases();

      alert(
        `Investigation Created: ${caseId}`
      );

    };

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        LIVE INVESTIGATION

      </h1>

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(
              e.target.value
            )
          }
          placeholder="Enter Wallet / Hash / Transaction"
          className="w-full rounded-lg border border-cyan-400/20 bg-black/40 p-4 text-cyan-300 outline-none"
        />

        <button
          onClick={startInvestigation}
          className="mt-6 rounded-lg bg-cyan-500 px-8 py-4 font-bold text-black transition-all hover:bg-cyan-400"
        >
          START INVESTIGATION
        </button>

      </div>

      {/* LIVE CASES */}

      <div className="mt-10 space-y-4">

        {cases.map((item) => (

          <div
            key={item.id}
            className="rounded-xl border border-cyan-400/20 bg-black/40 p-6"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-cyan-400">

                  {item.case_id}

                </p>

                <h2 className="mt-2 text-xl font-bold text-white">

                  {item.target}

                </h2>

              </div>

              <div className="text-right">

                <p className="text-green-400">

                  {item.status}

                </p>

                <p className="mt-2 text-xs text-gray-500">

                  {new Date(
                    item.created_at
                  ).toLocaleString()}

                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

