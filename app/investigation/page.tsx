"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function InvestigationsPage() {

  const [wallet, setWallet] = useState("");
  const [risk, setRisk] = useState("High Risk");
  const [priority, setPriority] = useState("Critical");
  const [investigator, setInvestigator] = useState("");
  const [notes, setNotes] = useState("");

  const [cases, setCases] = useState<any[]>([]);

  async function loadCases() {

    const { data } = await supabase
      .from("investigations")
      .select("*")
      .order("created_at", { ascending: false });

    setCases(data || []);

  }

  useEffect(() => {

    loadCases();

  }, []);

  async function createCase() {

    if (!wallet) {

      alert("Wallet required");
      return;

    }

    const { error } = await supabase
      .from("investigations")
      .insert([
        {
          wallet,
          risk_level: risk,
          priority,
          investigator,
          notes,
          status: "Open"
        }
      ]);

    if (error) {

      console.error(error);

      alert("Error creating investigation");

    } else {

      alert("Investigation created");

      setWallet("");
      setNotes("");
      setInvestigator("");

      loadCases();

    }

  }

  return (

    <main className="min-h-screen bg-black p-10 text-white">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold text-yellow-400">
              Investigations
            </h1>

            <p className="mt-4 text-gray-500">
              Institutional forensic investigation workflows.
            </p>

          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-yellow-300">
            FORENSIC UNIT
          </div>

        </div>

        {/* CREATE */}
        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">

          <h2 className="text-2xl font-semibold">
            Open Investigation
          </h2>

          <div className="mt-8 grid gap-5">

            <input
              type="text"
              placeholder="Wallet Address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />

            <input
              type="text"
              placeholder="Investigator"
              value={investigator}
              onChange={(e) => setInvestigator(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />

            <textarea
              placeholder="Investigation notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[140px] rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />

            <div className="grid gap-4 md:grid-cols-2">

              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
              >
                <option>High Risk</option>
                <option>Medium Risk</option>
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>

            </div>

            <button
              onClick={createCase}
              className="rounded-2xl bg-yellow-400 px-8 py-4 font-semibold text-black transition hover:bg-yellow-300"
            >
              Create Investigation
            </button>

          </div>

        </div>

        {/* CASES */}
        <div className="mt-12 grid gap-6">

          {cases.map((item) => (

            <div
              key={item.id}
              className="rounded-3xl border border-yellow-400/10 bg-yellow-400/5 p-8"
            >

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div>

                  <h2 className="break-all text-xl font-semibold text-cyan-300">
                    {item.wallet}
                  </h2>

                  <p className="mt-2 text-gray-400">
                    Investigator: {item.investigator || "Unassigned"}
                  </p>

                </div>

                <div className="flex gap-3">

                  <div className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">
                    {item.risk_level}
                  </div>

                  <div className="rounded-xl bg-yellow-500/20 px-4 py-2 text-sm text-yellow-300">
                    {item.priority}
                  </div>

                  <div className="rounded-xl bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
                    {item.status}
                  </div>

                </div>

              </div>

              <div className="mt-6 rounded-2xl border border-white/5 bg-black/30 p-5 text-gray-300">
                {item.notes}
              </div>

              <div className="mt-6 text-sm text-gray-500">
                {new Date(item.created_at).toLocaleString()}
              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}

