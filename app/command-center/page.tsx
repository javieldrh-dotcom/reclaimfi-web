"use client";

import { useState } from "react";

import Sidebar from "../components/Sidebar";

import CaseManagement from "../components/CaseManagement";

import AMLEngine from "../components/AMLEngine";

import AIEngine from "../components/AIEngine";

import CyberSecurity from "../components/CyberSecurity";

export default function CommandCenterPage() {

  const [activeTab, setActiveTab] =
    useState("overview");

  return (

    <main className="flex min-h-screen overflow-hidden bg-[#010409] text-white">

      {/* SIDEBAR */}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* MAIN CONTENT */}

      <section className="flex-1 overflow-y-auto p-10">

        {/* OVERVIEW */}

        {activeTab === "overview" && (

          <div>

            {/* HERO */}

            <div className="rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-12 shadow-[0_0_40px_rgba(59,130,246,0.08)]">

              <div className="flex items-center justify-between">

                <div>

                  <h1 className="text-7xl font-black tracking-tight text-blue-400">

                    AUDIT GLOBAL
                    <br />
                    INTELLIGENCE

                  </h1>

                  <p className="mt-6 max-w-4xl text-lg leading-relaxed text-gray-400">

                    Global forensic intelligence platform
                    for AML monitoring,
                    cybersecurity operations,
                    blockchain intelligence,
                    audit automation,
                    institutional compliance,
                    and operational risk management.

                  </p>

                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(34,211,238,0.15)]">

                  <p className="text-xs tracking-[0.4em] text-cyan-400">

                    SYSTEM STATUS

                  </p>

                  <h2 className="mt-4 text-5xl font-black text-cyan-300">

                    ACTIVE

                  </h2>

                </div>

              </div>

            </div>

            {/* METRICS */}

            <div className="mt-10 grid gap-6 md:grid-cols-4">

              <div className="rounded-3xl border border-blue-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(59,130,246,0.08)]">

                <p className="text-xs tracking-[0.3em] text-blue-400">

                  ACTIVE CASES

                </p>

                <h2 className="mt-5 text-6xl font-black text-blue-300">

                  48

                </h2>

              </div>

              <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(239,68,68,0.08)]">

                <p className="text-xs tracking-[0.3em] text-red-400">

                  CRITICAL ALERTS

                </p>

                <h2 className="mt-5 text-6xl font-black text-red-300">

                  7

                </h2>

              </div>

              <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(234,179,8,0.08)]">

                <p className="text-xs tracking-[0.3em] text-yellow-400">

                  AML FLAGS

                </p>

                <h2 className="mt-5 text-6xl font-black text-yellow-300">

                  14

                </h2>

              </div>

              <div className="rounded-3xl border border-green-500/20 bg-[#0d1117]/90 p-8 shadow-[0_0_25px_rgba(34,197,94,0.08)]">

                <p className="text-xs tracking-[0.3em] text-green-400">

                  UPTIME

                </p>

                <h2 className="mt-5 text-6xl font-black text-green-300">

                  99%

                </h2>

              </div>

            </div>

            {/* LIVE EVENTS */}

            <div className="mt-10 rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-8">

              <div className="flex items-center justify-between">

                <h2 className="text-3xl font-black text-blue-300">

                  LIVE INTELLIGENCE EVENTS

                </h2>

                <div className="flex items-center gap-3">

                  <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />

                  <span className="text-sm font-bold tracking-[0.2em] text-cyan-400">

                    LIVE STREAM

                  </span>

                </div>

              </div>

              <div className="mt-8 space-y-4">

                <div className="rounded-2xl border border-red-500/20 bg-black/30 p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-bold text-white">

                        Cross-chain laundering pattern detected

                      </h3>

                      <p className="mt-2 text-sm text-gray-400">

                        AI correlation engine triggered AML escalation

                      </p>

                    </div>

                    <span className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-300">

                      CRITICAL

                    </span>

                  </div>

                </div>

                <div className="rounded-2xl border border-yellow-500/20 bg-black/30 p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-bold text-white">

                        Suspicious procurement audit deviation

                      </h3>

                      <p className="mt-2 text-sm text-gray-400">

                        Compliance engine generated anomaly detection

                      </p>

                    </div>

                    <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-xs font-black text-yellow-300">

                      WARNING

                    </span>

                  </div>

                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-black/30 p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-bold text-white">

                        SOC monitoring synchronized successfully

                      </h3>

                      <p className="mt-2 text-sm text-gray-400">

                        Cybersecurity telemetry operational

                      </p>

                    </div>

                    <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-black text-cyan-300">

                      LIVE

                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* CASES */}

        {activeTab === "cases" && (
          <CaseManagement />
        )}

        {/* AML */}

        {activeTab === "aml" && (
          <AMLEngine />
        )}

        {/* AI */}

        {activeTab === "ai" && (
          <AIEngine />
        )}

        {/* CYBER */}

        {activeTab === "cybersecurity" && (
          <CyberSecurity />
        )}

        {/* BLOCKCHAIN */}

        {activeTab === "blockchain" && (

          <div>

            <h1 className="text-5xl font-black text-yellow-300">

              BLOCKCHAIN INTELLIGENCE

            </h1>

          </div>

        )}

        {/* COMPLIANCE */}

        {activeTab === "compliance" && (

          <div>

            <h1 className="text-5xl font-black text-purple-300">

              COMPLIANCE ENGINE

            </h1>

          </div>

        )}

        {/* RISK */}

        {activeTab === "risk" && (

          <div>

            <h1 className="text-5xl font-black text-orange-300">

              GLOBAL RISK MAP

            </h1>

          </div>

        )}

        {/* REPORTS */}

        {activeTab === "reports" && (

          <div>

            <h1 className="text-5xl font-black text-pink-300">

              REPORTS CENTER

            </h1>

          </div>

        )}

      </section>

    </main>

  );

}

