"use client";

import { useEffect, useRef, useState } from "react";

export default function DashboardPage() {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState("command");

  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let particles: any[] = [];

    function init() {

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      particles = [];

      for (let i = 0; i < 180; i++) {

        particles.push({

          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,

          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,

        });

      }

    }

    function draw() {

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // PARTICLES
        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          3,
          0,
          Math.PI * 2
        );

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#00ccff";

        ctx.fillStyle = "#7dd3fc";

        ctx.fill();

        ctx.shadowBlur = 0;

        // CONNECTIONS
        for (let j = idx + 1; j < particles.length; j++) {

          const d = Math.hypot(
            p.x - particles[j].x,
            p.y - particles[j].y
          );

          if (d < 220) {

            ctx.beginPath();

            ctx.moveTo(p.x, p.y);

            ctx.lineTo(
              particles[j].x,
              particles[j].y
            );

            ctx.lineWidth = 1.2;

            ctx.strokeStyle = `rgba(0,204,255,${
              1 - d / 220
            })`;

            ctx.stroke();

          }

        }

      });

      requestAnimationFrame(draw);

    }

    init();

    draw();

    window.addEventListener("resize", init);

    return () => {

      window.removeEventListener("resize", init);

    };

  }, []);

  const tabStyle = (tab: string) =>

    `w-full rounded-md border px-4 py-4 text-left text-sm tracking-[0.12em] transition-all duration-300
    ${
      activeTab === tab
        ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.55)]"
        : "border-[#1a3050] bg-[rgba(0,85,255,0.05)] text-white hover:bg-cyan-500/10 hover:border-cyan-400"
    }`;

  return (

    <main className="relative flex h-screen overflow-hidden bg-black text-white">

      {/* NEURAL NETWORK */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-100"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 z-10 bg-black/40" />

      {/* SIDEBAR */}
      <aside className="relative z-20 w-[320px] overflow-y-auto border-r border-cyan-500/20 bg-[#000a16]/70 p-6 backdrop-blur-md">

        <div className="mb-10 text-center">

          <h1 className="text-3xl font-black tracking-[0.18em]">

            RECLAIN
            <span className="text-cyan-400"> FI</span>

          </h1>

          <p className="mt-2 text-xs tracking-[0.35em] text-cyan-500">

            CENTRAL OPERATIVA v6.0

          </p>

        </div>

        <div className="space-y-3">

          <button
            onClick={() => setActiveTab("command")}
            className={tabStyle("command")}
          >
            🧠 COMMAND CENTER
          </button>

          <button
            onClick={() => setActiveTab("blockchain")}
            className={tabStyle("blockchain")}
          >
            ⛓️ BLOCKCHAIN INTELLIGENCE
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={tabStyle("reports")}
          >
            📑 FORENSIC REPORTS
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={tabStyle("alerts")}
          >
            🚨 ALERTS CENTER
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={tabStyle("ai")}
          >
            🤖 AI ENGINE
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={tabStyle("wallet")}
          >
            💼 WALLET TRACKING
          </button>

          <button
            onClick={() => setActiveTab("investigations")}
            className={tabStyle("investigations")}
          >
            🕵️ INVESTIGATIONS
          </button>

          <button
            onClick={() => setActiveTab("risk")}
            className={tabStyle("risk")}
          >
            ⚠️ RISK ENGINE
          </button>

          <button
            onClick={() => setActiveTab("audits")}
            className={tabStyle("audits")}
          >
            📋 AUDITS
          </button>

          <button
            onClick={() => setActiveTab("compliance")}
            className={tabStyle("compliance")}
          >
            ✅ COMPLIANCE
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <section className="relative z-20 flex-1 overflow-y-auto p-10">

        {/* COMMAND CENTER */}
        {activeTab === "command" && (

          <div>

            <h1 className="text-5xl font-black tracking-[0.12em] text-cyan-300">

              COMMAND CENTER

            </h1>

            <p className="mt-4 text-gray-400">

              Advanced forensic intelligence ecosystem

            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3">

              <div className="rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

                <p className="text-xs tracking-[0.3em] text-cyan-400">
                  ACTIVE CASES
                </p>

                <h2 className="mt-4 text-5xl font-black">
                  24
                </h2>

              </div>

              <div className="rounded-xl border border-red-500/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

                <p className="text-xs tracking-[0.3em] text-red-400">
                  HIGH RISK
                </p>

                <h2 className="mt-4 text-5xl font-black text-red-400">
                  7
                </h2>

              </div>

              <div className="rounded-xl border border-green-500/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

                <p className="text-xs tracking-[0.3em] text-green-400">
                  TRACKED WALLETS
                </p>

                <h2 className="mt-4 text-5xl font-black text-green-400">
                  182
                </h2>

              </div>

            </div>

          </div>

        )}

        {/* BLOCKCHAIN */}
        {activeTab === "blockchain" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">

              BLOCKCHAIN INTELLIGENCE

            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              <div className="space-y-4 font-mono text-sm text-green-400">

                <p>[10:33:42] Wallet synchronization initialized...</p>

                <p>[10:33:44] Binance hot wallet activity detected...</p>

                <p>[10:33:48] AML verification completed...</p>

                <p>[10:33:50] Cross-chain movement identified...</p>

                <p>[10:33:53] AI forensic engine evaluating patterns...</p>

              </div>

            </div>

          </div>

        )}

        {/* REPORTS */}
        {activeTab === "reports" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">

              FORENSIC REPORTS

            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              <p className="text-gray-300 leading-8">

                Institutional forensic reporting system operational.

              </p>

            </div>

          </div>

        )}

        {/* ALERTS */}
        {activeTab === "alerts" && (

          <div>

            <h1 className="text-5xl font-black text-red-400">

              ALERTS CENTER

            </h1>

            <div className="mt-10 space-y-5">

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-md">

                Suspicious mixer interaction detected.

              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6 backdrop-blur-md">

                Unusual wallet behavior identified.

              </div>

            </div>

          </div>

        )}

        {/* AI ENGINE */}
        {activeTab === "ai" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">

              AGI ENGINE

            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              <p className="leading-8 text-gray-300">

                Artificial intelligence forensic engine actively monitoring
                blockchain anomalies and behavioral patterns.

              </p>

            </div>

          </div>

        )}

        {/* WALLET TRACKING */}
        {activeTab === "wallet" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">
              WALLET TRACKING
            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              <div className="space-y-4 font-mono text-green-400">

                <p>[LIVE] Tracking Binance wallets...</p>
                <p>[LIVE] Ethereum node synchronized...</p>
                <p>[LIVE] Suspicious wallet path detected...</p>
                <p>[LIVE] AML engine operational...</p>

              </div>

            </div>

          </div>

        )}

        {/* INVESTIGATIONS */}
        {activeTab === "investigations" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">
              INVESTIGATIONS
            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              Investigation center operational.

            </div>

          </div>

        )}

        {/* RISK */}
        {activeTab === "risk" && (

          <div>

            <h1 className="text-5xl font-black text-red-400">
              RISK ENGINE
            </h1>

            <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/10 p-8 backdrop-blur-md">

              High-risk blockchain activity monitoring enabled.

            </div>

          </div>

        )}

        {/* AUDITS */}
        {activeTab === "audits" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">
              AUDITS
            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              Audit infrastructure online.

            </div>

          </div>

        )}

        {/* COMPLIANCE */}
        {activeTab === "compliance" && (

          <div>

            <h1 className="text-5xl font-black text-cyan-300">
              COMPLIANCE
            </h1>

            <div className="mt-10 rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-8 backdrop-blur-md">

              ISO / AML / KYC verification systems active.

            </div>

          </div>

        )}

      </section>

    </main>

  );

}