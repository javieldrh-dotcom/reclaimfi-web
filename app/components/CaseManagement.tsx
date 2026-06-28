"use client";

import { useEffect, useState } from "react";

import {

  createCase,
  getCases,

} from "../lib/supabaseCases";

interface CaseItem {

  id: string;

  case_code: string;

  title: string;

  description?: string;

  case_type?: string;

  priority?: string;

  status?: string;

  risk_level?: string;

}

export default function CaseManagement() {

  const [cases, setCases] =
    useState<CaseItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  //
  // LOAD CASES
  //

  async function loadCases() {

    setLoading(true);

    const data =
      await getCases();

    setCases(data || []);

    setLoading(false);

  }

  //
  // CREATE NEW CASE
  //

  async function handleCreateCase() {

    if (!title) return;

    try {

      setCreating(true);

      await createCase({

        case_code:
          "AGI-" +
          Math.floor(
            Math.random() * 999999
          ),

        title,

        description,

        case_type:
          "FINANCIAL",

        priority:
          "HIGH",

        status:
          "OPEN",

        risk_level:
          "MEDIUM",

      });

      setTitle("");

      setDescription("");

      await loadCases();

    } catch (error) {

      console.error(error);

    } finally {

      setCreating(false);

    }

  }

  //
  // INITIAL LOAD
  //

  useEffect(() => {

    loadCases();

  }, []);

  return (

    <div>

      {/* HEADER */}

      <div className="rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(59,130,246,0.08)]">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black text-blue-300">

              CASE MANAGEMENT

            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">

              Enterprise investigation and operational
              case management system integrated with
              realtime financial intelligence,
              AML analysis,
              cybersecurity monitoring,
              and forensic auditing workflows.

            </p>

          </div>

          <div className="rounded-3xl border border-blue-500/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(59,130,246,0.15)]">

            <p className="text-xs tracking-[0.35em] text-blue-400">

              ACTIVE CASES

            </p>

            <h2 className="mt-4 text-5xl font-black text-blue-300">

              {cases.length}

            </h2>

          </div>

        </div>

      </div>

      {/* CREATE CASE */}

      <div className="mt-10 rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-8">

        <h2 className="text-3xl font-black text-blue-300">

          CREATE NEW CASE

        </h2>

        <div className="mt-8 grid gap-6">

          <input
            type="text"
            placeholder="Case title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="rounded-2xl border border-blue-500/20 bg-black/40 px-6 py-5 text-white outline-none transition-all focus:border-blue-400"
          />

          <textarea
            placeholder="Case description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows={5}
            className="rounded-2xl border border-blue-500/20 bg-black/40 px-6 py-5 text-white outline-none transition-all focus:border-blue-400"
          />

          <button
            onClick={
              handleCreateCase
            }
            disabled={creating}
            className="rounded-2xl bg-blue-500 px-8 py-5 text-lg font-black tracking-[0.15em] text-black transition-all hover:bg-blue-400 disabled:opacity-50"
          >

            {creating
              ? "CREATING..."
              : "CREATE CASE"}

          </button>

        </div>

      </div>

      {/* CASE LIST */}

      <div className="mt-10 rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-black text-blue-300">

              INVESTIGATION CASES

            </h2>

            <p className="mt-3 text-gray-500">

              Realtime operational investigations

            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-blue-400" />

            <span className="text-sm font-black tracking-[0.25em] text-blue-300">

              LIVE DATABASE

            </span>

          </div>

        </div>

        {/* CASES */}

        <div className="mt-10 space-y-5">

          {loading ? (

            <div className="rounded-2xl border border-blue-500/10 bg-black/30 p-8 text-center text-gray-400">

              Loading cases...

            </div>

          ) : cases.length === 0 ? (

            <div className="rounded-2xl border border-blue-500/10 bg-black/30 p-8 text-center text-gray-400">

              No cases registered

            </div>

          ) : (

            cases.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-blue-500/10 bg-black/30 p-6 transition-all hover:border-blue-400/20 hover:bg-blue-500/5"
              >

                <div className="flex items-center justify-between">

                  {/* LEFT */}

                  <div>

                    <div className="flex items-center gap-4">

                      <span className="rounded-full bg-blue-500/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-blue-300">

                        {item.case_code}

                      </span>

                      <span className="text-sm text-gray-500">

                        {item.case_type}

                      </span>

                    </div>

                    <h3 className="mt-4 text-2xl font-bold text-white">

                      {item.title}

                    </h3>

                    <p className="mt-3 max-w-4xl text-gray-400">

                      {item.description}

                    </p>

                  </div>

                  {/* RIGHT */}

                  <div className="flex gap-4">

                    <span className="rounded-full bg-yellow-500/20 px-5 py-3 text-xs font-black tracking-[0.2em] text-yellow-300">

                      {item.priority}

                    </span>

                    <span className="rounded-full bg-green-500/20 px-5 py-3 text-xs font-black tracking-[0.2em] text-green-300">

                      {item.status}

                    </span>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>

  );

}

