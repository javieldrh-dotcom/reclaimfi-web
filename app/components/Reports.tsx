"use client";

export default function Reports() {

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        REPORTS CENTER

      </h1>

      <p className="mt-4 text-gray-400">

        Operational reporting and forensic documentation system.

      </p>

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <div className="space-y-5">

          <div className="rounded-lg border border-cyan-400/10 bg-black/30 p-5">

            Financial Investigation Report

          </div>

          <div className="rounded-lg border border-cyan-400/10 bg-black/30 p-5">

            AML Compliance Summary

          </div>

          <div className="rounded-lg border border-cyan-400/10 bg-black/30 p-5">

            Cybersecurity Incident Report

          </div>

        </div>

      </div>

    </div>

  );

}

