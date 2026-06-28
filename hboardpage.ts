warning: in the working copy of 'next.config.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'package-lock.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'package.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'tsconfig.json', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/app/.env.local b/app/.env.local[m
[1mdeleted file mode 100644[m
[1mindex 787a424..0000000[m
[1m--- a/app/.env.local[m
[1m+++ /dev/null[m
[36m@@ -1,2 +0,0 @@[m
[31m-NEXT_PUBLIC_SUPABASE_URL=[m
[31m-NEXT_PUBLIC_SUPABASE_ANON_KEY=[m
\ No newline at end of file[m
[1mdiff --git a/app/aml/page.tsx b/app/aml/page.tsx[m
[1mindex e69de29..139597f 100644[m
[1m--- a/app/aml/page.tsx[m
[1m+++ b/app/aml/page.tsx[m
[36m@@ -0,0 +1,2 @@[m
[32m+[m
[32m+[m
[1mdiff --git a/app/audit/page.tsx b/app/audit/page.tsx[m
[1mdeleted file mode 100644[m
[1mindex e69de29..0000000[m
[1mdiff --git a/app/blockchain/page.tsx b/app/blockchain/page.tsx[m
[1mindex e69de29..0eed5c2 100644[m
[1m--- a/app/blockchain/page.tsx[m
[1m+++ b/app/blockchain/page.tsx[m
[36m@@ -0,0 +1,299 @@[m
[32m+[m[32m"use client";[m
[32m+[m
[32m+[m[32mimport { useState } from "react";[m
[32m+[m[32mimport { supabase } from "../lib/supabase";[m
[32m+[m
[32m+[m[32mexport default function BlockchainPage() {[m
[32m+[m
[32m+[m[32m  const [wallet, setWallet] = useState("");[m
[32m+[m[32m  const [analysis, setAnalysis] = useState<any>(null);[m
[32m+[m[32m  const [loading, setLoading] = useState(false);[m
[32m+[m
[32m+[m[32m  async function analyzeWallet() {[m
[32m+[m
[32m+[m[32m    if (!wallet) {[m
[32m+[m[32m      alert("Enter wallet address");[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    setLoading(true);[m
[32m+[m
[32m+[m[32m    let risk = "Low Risk";[m
[32m+[m[32m    let score = 92;[m
[32m+[m[32m    let behavior = "Normal";[m
[32m+[m[32m    let activity = "Operational";[m
[32m+[m[32m    let connections = 4;[m
[32m+[m[32m    let volume = "$45,000";[m
[32m+[m
[32m+[m[32m    let alerts = [[m
[32m+[m[32m      "No critical alerts detected",[m
[32m+[m[32m      "Normal behavioral activity"[m
[32m+[m[32m    ];[m
[32m+[m
[32m+[m[32m    if (wallet.toLowerCase().includes("risk")) {[m
[32m+[m
[32m+[m[32m      risk = "High Risk";[m
[32m+[m[32m      score = 28;[m
[32m+[m[32m      behavior = "Obfuscation";[m
[32m+[m[32m      activity = "Mixer Exposure";[m
[32m+[m[32m      connections = 28;[m
[32m+[m[32m      volume = "$2,400,000";[m
[32m+[m
[32m+[m[32m      alerts = [[m
[32m+[m[32m        "Mixer interaction detected",[m
[32m+[m[32m        "Suspicious transaction patterns",[m
[32m+[m[32m        "High velocity movement",[m
[32m+[m[32m        "Cross-chain obfuscation"[m
[32m+[m[32m      ];[m
[32m+[m
[32m+[m[32m    } else if ([m
[32m+[m[32m      wallet.toLowerCase().includes("review")[m
[32m+[m[32m    ) {[m
[32m+[m
[32m+[m[32m      risk = "Medium Risk";[m
[32m+[m[32m      score = 61;[m
[32m+[m[32m      behavior = "Unusual";[m
[32m+[m[32m      activity = "Compliance Review";[m
[32m+[m[32m      connections = 12;[m
[32m+[m[32m      volume = "$680,000";[m
[32m+[m
[32m+[m[32m      alerts = [[m
[32m+[m[32m        "Manual compliance review recommended",[m
[32m+[m[32m        "Unusual transaction distribution"[m
[32m+[m[32m      ];[m
[32m+[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    const { error } = await supabase[m
[32m+[m[32m      .from("wallets")[m
[32m+[m[32m      .insert([[m
[32m+[m[32m        {[m
[32m+[m[32m          address: wallet,[m
[32m+[m[32m          risk_level: risk,[m
[32m+[m[32m          score: score,[m
[32m+[m[32m          behavior: behavior,[m
[32m+[m[32m          activity: activity,[m
[32m+[m[32m          connections: connections[m
[32m+[m[32m        }[m
[32m+[m[32m      ]);[m
[32m+[m
[32m+[m[32m    if (error) {[m
[32m+[m
[32m+[m[32m      console.error(error);[m
[32m+[m
[32m+[m[32m      alert("Error saving wallet intelligence");[m
[32m+[m
[32m+[m[32m    } else {[m
[32m+[m
[32m+[m[32m      alert("Wallet intelligence stored successfully");[m
[32m+[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    setAnalysis({[m
[32m+[m[32m      wallet,[m
[32m+[m[32m      risk,[m
[32m+[m[32m      score,[m
[32m+[m[32m      behavior,[m
[32m+[m[32m      activity,[m
[32m+[m[32m      connections,[m
[32m+[m[32m      volume,[m
[32m+[m[32m      alerts[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    setLoading(false);[m
[32m+[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  return ([m
[32m+[m
[32m+[m[32m    <main className="min-h-screen bg-black p-10 text-white">[m
[32m+[m
[32m+[m[32m      <div className="mx-auto max-w-7xl">[m
[32m+[m
[32m+[m[32m        {/* HEADER */}[m
[32m+[m[32m        <div className="flex items-center justify-between">[m
[32m+[m
[32m+[m[32m          <div>[m
[32m+[m
[32m+[m[32m            <h1 className="text-5xl font-bold text-cyan-400">[m
[32m+[m[32m              Blockchain Intelligence[m
[32m+[m[32m            </h1>[m
[32m+[m
[32m+[m[32m            <p className="mt-4 text-gray-500">[m
[32m+[m[32m              Advanced wallet monitoring and forensic analysis.[m
[32m+[m[32m            </p>[m
[32m+[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">[m
[32m+[m[32m            AGI Blockchain Engine[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m        </div>[m
[32m+[m
[32m+[m[32m        {/* SEARCH */}[m
[32m+[m[32m        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">[m
[32m+[m
[32m+[m[32m          <h2 className="text-2xl font-semibold">[m
[32m+[m[32m            Wallet Analysis[m
[32m+[m[32m          </h2>[m
[32m+[m
[32m+[m[32m          <div className="mt-6 flex flex-col gap-4 md:flex-row">[m
[32m+[m
[32m+[m[32m            <input[m
[32m+[m[32m              type="text"[m
[32m+[m[32m              placeholder="Enter wallet address..."[m
[32m+[m[32m              value={wallet}[m
[32m+[m[32m              onChange={(e) => setWallet(e.target.value)}[m
[32m+[m[32m              className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"[m
[32m+[m[32m            />[m
[32m+[m
[32m+[m[32m            <button[m
[32m+[m[32m              onClick={analyzeWallet}[m
[32m+[m[32m              disabled={loading}[m
[32m+[m[32m              className="rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300"[m
[32m+[m[32m            >[m
[32m+[m[32m              {loading ? "Analyzing..." : "Analyze Wallet"}[m
[32m+[m[32m            </button>[m
[32m+[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m        </div>[m
[32m+[m
[32m+[m[32m        {/* RESULTS */}[m
[32m+[m[32m        {analysis && ([m
[32m+[m
[32m+[m[32m          <div className="mt-10 grid gap-8">[m
[32m+[m
[32m+[m[32m            {/* TOP CARDS */}[m
[32m+[m[32m            <div className="grid gap-6 md:grid-cols-4">[m
[32m+[m
[32m+[m[32m              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">[m
[32m+[m
[32m+[m[32m                <p className="text-sm text-gray-500">[m
[32m+[m[32m                  Blockchain Score[m
[32m+[m[32m                </p>[m
[32m+[m
[32m+[m[32m                <h3 className="mt-4 text-4xl font-bold text-cyan-400">[m
[32m+[m[32m                  {analysis.score}[m
[32m+[m[32m                </h3>[m
[32m+[m
[32m+[m[32m              </div>[m
[32m+[m
[32m+[m[32m              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">[m
[32m+[m
[32m+[m[32m                <p className="text-sm text-gray-500">[m
[32m+[m[32m                  AML Risk[m
[32m+[m[32m                </p>[m
[32m+[m
[32m+[m[32m                <h3[m
[32m+[m[32m                  className={[m
[32m+[m[32m                    "mt-4 text-3xl font-bold " +[m
[32m+[m
[32m+[m[32m                    (analysis.risk === "High Risk"[m
[32m+[m[32m                      ? "text-red-400"[m
[32m+[m[32m                      : analysis.risk === "Medium Risk"[m
[32m+[m[32m                      ? "text-yellow-400"[m
[32m+[m[32m                      : "text-green-400")[m
[32m+[m[32m                  }[m
[32m+[m[32m                >[m
[32m+[m[32m                  {analysis.risk}[m
[32m+[m[32m                </h3>[m
[32m+[m
[32m+[m[32m              </div>[m
[32m+[m
[32m+[m[32m              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">[m
[32m+[m
[32m+[m[32m                <p className="text-sm text-gray-500">[m
[32m+[m[32m                  Estimated Volume[m
[32m+[m[32m                </p>[m
[32m+[m
[32m+[m[32m                <h3 className="mt-4 text-3xl font-bold text-white">[m
[32m+[m[32m                  {analysis.volume}[m
[32m+[m[32m                </h3>[m
[32m+[m
[32m+[m[32m              </div>[m
[32m+[m
[32m+[m[32m              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">[m
[32m+[m
[32m+[m[32m                <p className="text-sm text-gray-500">[m
[32m+[m[32m                  Connections[m
[32m+[m[32m                </p>[m
[32m+[m
[32m+[m[32m                <h3 className="mt-4 text-3xl font-bold text-cyan-300">[m
[32m+[m[32m                  {analysis.connections}[m
[32m+[m[32m                </h3>[m
[32m+[m
[32m+[m[32m              </div>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m            {/* WALLET */}[m
[32m+[m[32m            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">[m
[32m+[m
[32m+[m[32m              <p className="text-sm text-gray-500">[m
[32m+[m[32m                Wallet Address[m
[32m+[m[32m              </p>[m
[32m+[m
[32m+[m[32m              <p className="mt-4 break-all text-cyan-300">[m
[32m+[m[32m                {analysis.wallet}[m
[32m+[m[32m              </p>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m            {/* ALERTS */}[m
[32m+[m[32m            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">[m
[32m+[m
[32m+[m[32m              <h2 className="text-2xl font-semibold text-red-300">[m
[32m+[m[32m                Intelligence Alerts[m
[32m+[m[32m              </h2>[m
[32m+[m
[32m+[m[32m              <div className="mt-6 grid gap-4">[m
[32m+[m
[32m+[m[32m                {analysis.alerts.map((alert: string, index: number) => ([m
[32m+[m
[32m+[m[32m                  <div[m
[32m+[m[32m                    key={index}[m
[32m+[m[32m                    className="rounded-2xl border border-white/5 bg-black/30 p-5"[m
[32m+[m[32m                  >[m
[32m+[m[32m                    {alert}[m
[32m+[m[32m                  </div>[m
[32m+[m
[32m+[m[32m                ))}[m
[32m+[m
[32m+[m[32m              </div>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m            {/* AGI */}[m
[32m+[m[32m            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-8">[m
[32m+[m
[32m+[m[32m              <h2 className="text-2xl font-semibold text-cyan-300">[m
[32m+[m[32m                AGI Recommendation[m
[32m+[m[32m              </h2>[m
[32m+[m
[32m+[m[32m              <p className="mt-5 leading-8 text-gray-300">[m
[32m+[m
[32m+[m[32m                {[m
[32m+[m[32m                  analysis.risk === "High Risk"[m
[32m+[m[32m                  ? "Immediate forensic investigation recommended. Potential laundering indicators detected."[m
[32m+[m[32m                  : analysis.risk === "Medium Risk"[m
[32m+[m[32m                  ? "Compliance validation and transaction review recommended."[m
[32m+[m[32m                  : "No major behavioral anomalies detected during preliminary analysis."[m
[32m+[m[32m                }[m
[32m+[m
[32m+[m[32m              </p>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m        )}[m
[32m+[m
[32m+[m[32m      </div>[m
[32m+[m
[32m+[m[32m    </main>[m
[32m+[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[32m+[m
[1mdiff --git a/app/compliance/page.tsx b/app/compliance/page.tsx[m
[1mindex dbe0ca6..bab5859 100644[m
[1m--- a/app/compliance/page.tsx[m
[1m+++ b/app/compliance/page.tsx[m
[36m@@ -1,9 +1,70 @@[m
[31m-export default function Compliance() {[m
[32m+[m[32mexport default function CompliancePage() {[m
   return ([m
     <main className="min-h-screen bg-black text-white p-10">[m
[31m-      <h1 className="text-4xl font-bold text-cyan-400">[m
[31m-        Compliance[m
[31m-      </h1>[m
[32m+[m
[32m+[m[32m      <div className="mx-auto max-w-7xl">[m
[32m+[m
[32m+[m[32m        <div className="flex items-center justify-between">[m
[32m+[m
[32m+[m[32m          <div>[m
[32m+[m[32m            <h1 className="text-4xl font-bold text-cyan-400">[m
[32m+[m[32m              Compliance Center[m
[32m+[m[32m            </h1>[m
[32m+[m
[32m+[m[32m            <p className="mt-3 text-gray-500">[m
[32m+[m[32m              AML, KYC y monitoreo regulatorio institucional.[m
[32m+[m[32m            </p>[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-yellow-300">[m
[32m+[m[32m            AML / KYC[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m        </div>[m
[32m+[m
[32m+[m[32m        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">[m
[32m+[m
[32m+[m[32m          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">[m
[32m+[m
[32m+[m[32m            <h2 className="text-2xl font-semibold">[m
[32m+[m[32m              KYC Validation[m
[32m+[m[32m            </h2>[m
[32m+[m
[32m+[m[32m            <p className="mt-4 text-gray-500">[m
[32m+[m[32m              Verificación institucional de identidad.[m
[32m+[m[32m            </p>[m
[32m+[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">[m
[32m+[m
[32m+[m[32m            <h2 className="text-2xl font-semibold">[m
[32m+[m[32m              AML Monitoring[m
[32m+[m[32m            </h2>[m
[32m+[m
[32m+[m[32m            <p className="mt-4 text-gray-500">[m
[32m+[m[32m              Monitoreo de actividad sospechosa.[m
[32m+[m[32m            </p>[m
[32m+[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">[m
[32m+[m
[32m+[m[32m            <h2 className="text-2xl font-semibold">[m
[32m+[m[32m              Regulatory Status[m
[32m+[m[32m            </h2>[m
[32m+[m
[32m+[m[32m            <p className="mt-4 text-gray-500">[m
[32m+[m[32m              Estado regulatorio y cumplimiento.[m
[32m+[m[32m            </p>[m
[32m+[m
[32m+[m[32m          </div>[m
[32m+[m
[32m+[m[32m        </div>[m
[32m+[m
[32m+[m[32m      </div>[m
[32m+[m
     </main>[m
   );[m
[31m-}[m
\ No newline at end of file[m
[32m+[m[32m}[m
[41m+[m
[1mdiff --git a/app/contacto/page.tsx b/app/contacto/page.tsx[m
[1mindex fa92c80..17b52f6 100644[m
[1m--- a/app/contacto/page.tsx[m
[1m+++ b/app/contacto/page.tsx[m
[36m@@ -43,4 +43,5 @@[m [mexport default function Contacto() {[m
       </div>[m
     </main>[m
   );[m
[31m-}[m
\ No newline at end of file[m
[32m+[m[32m}[m
[41m+[m
[1mdiff --git a/app/dashboard/page.tsx b/app/dashboard/page.tsx[m
[1mindex 5158eae..6497d1d 100644[m
[1m--- a/app/dashboard/page.tsx[m
[1m+++ b/app/dashboard/page.tsx[m
[36m@@ -1,23 +1,43 @@[m
[31m-export default function Dashboard() {[m
[32m+[m[32m"use client";[m
[32m+[m
[32m+[m[32mimport { ROUTES } from "@/app/lib/routes";[m
[32m+[m
[32m+[m[32mexport default function Dashbo