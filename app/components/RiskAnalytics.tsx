"use client";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

interface Metrics {

  totalCases: number;

  highRisk: number;

  openCases: number;

  evidenceFiles: number;

}

export default function RiskAnalytics() {

  const [metrics, setMetrics] =
    useState<Metrics>({

      totalCases: 0,

      highRisk: 0,

      openCases: 0,

      evidenceFiles: 0,

    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadMetrics();

  }, []);

  async function loadMetrics() {

    setLoading(true);

    // CASES

    const {
      data: casesData,
    } = await supabase
      .from("cases")
      .select("*");

    // EVIDENCE

    const {
      data: evidenceData,
    } = await supabase
      .from("case_evidence")
      .select("*");

    const totalCases =
      casesData?.length || 0;

    const highRisk =
      casesData?.filter(
        (c) =>
          c.priority === "HIGH"
      ).length || 0;

    const openCases =
      casesData?.filter(
        (c) =>
          c.status === "OPEN"
      ).length || 0;

    const evidenceFiles =
      evidenceData?.length || 0;

    setMetrics({

      totalCases,

      highRisk,

      openCases,

      evidenceFiles,

    });

    setLoading(false);

  }

  if (loading) {

    return (

      <div className="flex items-center justify-center py-20">

        <h2 className="text-2xl font-black text-cyan-300">

          LOADING RISK ANALYTICS...

        </h2>

      </div>

    );

  }

  return (

    <div>

      {/* HEADER */}

      <div>

        <h1 className="text-5xl font-black text-cyan-300">

          GLOBAL RISK ANALYTICS

        </h1>

        <p className="mt-4 text-gray-400">

          Institutional intelligence and operational risk metrics.

        </p>

      </div>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        {/* TOTAL CASES */}

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            TOTAL CASES

          </p>

          <h2 className="mt-4 text-5xl font-black text-cyan-300">

            {metrics.totalCases}

          </h2>

        </div>

        {/* OPEN CASES */}

        <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            OPEN CASES

          </p>

          <h2 className="mt-4 text-5xl font-black text-yellow-400">

            {metrics.openCases}

          </h2>

        </div>

        {/* HIGH RISK */}

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-4 text-5xl font-black text-red-400">

            {metrics.highRisk}

          </h2>

        </div>

        {/* EVIDENCE */}

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-green-400">

            EVIDENCE FILES

          </p>

          <h2 className="mt-4 text-5xl font-black text-green-400">

            {metrics.evidenceFiles}

          </h2>

        </div>

      </div>

      {/* RISK PANELS */}

      <div className="mt-10 grid gap-6 md:grid-cols-2">

        {/* GLOBAL STATUS */}

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8">

          <h2 className="text-2xl font-black text-cyan-300">

            GLOBAL STATUS

          </h2>

          <div className="mt-8 space-y-4">

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Operational Integrity

              </span>

              <span className="font-bold text-green-400">

                STABLE

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Threat Exposure

              </span>

              <span className="font-bold text-yellow-400">

                MEDIUM

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                AML Monitoring

              </span>

              <span className="font-bold text-cyan-300">

                ACTIVE

              </span>

            </div>

          </div>

        </div>

        {/* SECTOR ANALYTICS */}

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8">

          <h2 className="text-2xl font-black text-cyan-300">

            SECTOR ANALYTICS

          </h2>

          <div className="mt-8 space-y-4">

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Public Sector

              </span>

              <span className="font-bold text-cyan-300">

                MONITORED

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Financial Institutions

              </span>

              <span className="font-bold text-yellow-400">

                HIGH WATCH

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Cybersecurity

              </span>

              <span className="font-bold text-red-400">

                ELEVATED

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Tax Compliance

              </span>

              <span className="font-bold text-green-400">

                STABLE

              </span>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

