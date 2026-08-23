"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeCases: 0,
    openCases: 0,
    highRisk: 0,
    evidenceFiles: 0,
    criticalAlerts: 0,
    trackedWallets: 0,
  });
  const [recentCases, setRecentCases] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadStats() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      if (!cid) return;

      const { data: allCases } = await supabase.from("cases").select("*").eq("company_id", cid).order("created_at", { ascending: false });
      const casesList = allCases ?? [];

      const { count: evidenceCount } = await supabase.from("case_evidence").select("*", { count: "exact", head: true }).in("case_id", casesList.map((c: any) => c.id));
      const { count: alertsCount } = await supabase.from("alerts").select("*", { count: "exact", head: true }).eq("company_id", cid).in("severity", ["CRITICAL", "HIGH"]);
      const { count: walletsCount } = await supabase.from("wallet_addresses").select("*", { count: "exact", head: true });

      setStats({
        activeCases: casesList.length,
        openCases: casesList.filter((c: any) => c.status === "OPEN").length,
        highRisk: casesList.filter((c: any) => c.risk_level === "HIGH").length,
        evidenceFiles: evidenceCount ?? 0,
        criticalAlerts: alertsCount ?? 0,
        trackedWallets: walletsCount ?? 0,
      });
      setRecentCases(casesList.slice(0, 5));
    }

    loadStats();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas!.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];

    function init() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < 180; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx!.shadowBlur = 25;
        ctx!.shadowColor = "#00ccff";
        ctx!.fillStyle = "#7dd3fc";
        ctx!.fill();
        ctx!.shadowBlur = 0;

        for (let j = idx + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (d < 220) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.lineWidth = 1.2;
            ctx!.strokeStyle = `rgba(0,204,255,${1 - d / 220})`;
            ctx!.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, []);

  const tabStyle = (tab: string) =>
    `block w-full rounded-md border px-4 py-4 text-left text-sm tracking-[0.12em] transition-all duration-300
    border-[#1a3050] bg-[rgba(0,85,255,0.05)] text-white hover:bg-cyan-500/10 hover:border-cyan-400`;

  const riskColors: Record<string, string> = { HIGH: "#f87171", MEDIUM: "#facc15", LOW: "#4ade80" };

  return (
    <main className="relative flex h-screen overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-100" />
      <div className="absolute inset-0 z-10 bg-black/40" />

      <aside className="relative z-20 w-[320px] overflow-y-auto border-r border-cyan-500/20 bg-[#000a16]/70 p-6 backdrop-blur-md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-[0.18em]">
            RECLAIM<span className="text-cyan-400"> FI</span>
          </h1>
          <p className="mt-2 text-xs tracking-[0.35em] text-cyan-500">
            CENTRAL OPERATIVA v6.0
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard" className={tabStyle("command")}>COMMAND CENTER</Link>
          <Link href="/ingestion" className={tabStyle("ingestion")}>DATA INGESTION</Link>
          <Link href="/blockchain" className={tabStyle("blockchain")}>BLOCKCHAIN INTELLIGENCE</Link>
          <Link href="/intel" className={tabStyle("intel")}>INTEL</Link>
          <Link href="/investigation" className={tabStyle("investigations")}>INVESTIGATIONS</Link>
          <Link href="/risk" className={tabStyle("risk")}>RISK ENGINE</Link>
          <Link href="/alerts" className={tabStyle("alerts")}>ALERTS CENTER</Link>
          <Link href="/tracking" className={tabStyle("wallet")}>WALLET TRACKING</Link>
          <Link href="/audits" className={tabStyle("audits")}>AUDITS</Link>
          <Link href="/compliance" className={tabStyle("compliance")}>COMPLIANCE</Link>
          <Link href="/aml" className={tabStyle("aml")}>AML</Link>
          <Link href="/reports" className={tabStyle("reports")}>FORENSIC REPORTS</Link>
          <Link href="/history" className={tabStyle("history")}>HISTORY</Link>
          <Link href="/dashboard/audit" className={tabStyle("audit")}>INTEGRIDAD DE EVIDENCIA</Link>
          <Link href="/dashboard/graph" className={tabStyle("graph")}>GRAFO FORENSE</Link>
          <Link href="/security" className={tabStyle("security")}>SEGURIDAD DE CUENTA</Link>
        </div>
      </aside>

      <section className="relative z-20 flex-1 overflow-y-auto p-10">
        <h1 className="text-5xl font-black tracking-[0.12em] text-cyan-300">COMMAND CENTER</h1>
        <p className="mt-4 text-gray-400">Ecosistema de inteligencia forense</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-cyan-400/20 bg-[rgba(13,17,23,0.58)] p-6 backdrop-blur-md">
            <p className="text-xs tracking-[0.2em] text-cyan-400">CASOS TOTALES</p>
            <h2 className="mt-3 text-4xl font-black">{stats.activeCases}</h2>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-[rgba(13,17,23,0.58)] p-6 backdrop-blur-md">
            <p className="text-xs tracking-[0.2em] text-yellow-400">CASOS ABIERTOS</p>
            <h2 className="mt-3 text-4xl font-black text-yellow-400">{stats.openCases}</h2>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-[rgba(13,17,23,0.58)] p-6 backdrop-blur-md">
            <p className="text-xs tracking-[0.2em] text-red-400">RIESGO ALTO</p>
            <h2 className="mt-3 text-4xl font-black text-red-400">{stats.highRisk}</h2>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-[rgba(13,17,23,0.58)] p-6 backdrop-blur-md">
            <p className="text-xs tracking-[0.2em] text-green-400">ARCHIVOS DE EVIDENCIA</p>
            <h2 className="mt-3 text-4xl font-black text-green-400">{stats.evidenceFiles}</h2>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-[rgba(13,17,23,0.58)] p-6 backdrop-blur-md">
            <p className="text-xs tracking-[0.2em] text-orange-400">ALERTAS CRITICAS</p>
            <h2 className="mt-3 text-4xl font-black text-orange-400">{stats.criticalAlerts}</h2>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-[rgba(13,17,23,0.58)] p-6 backdrop-blur-md">
            <p className="text-xs tracking-[0.2em] text-purple-400">WALLETS RASTREADAS</p>
            <h2 className="mt-3 text-4xl font-black text-purple-400">{stats.trackedWallets}</h2>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-bold text-cyan-300">Casos Recientes</h2>
        <div className="mt-4 grid gap-3">
          {recentCases.length === 0 ? (
            <p className="text-gray-500">Aun no tienes casos registrados. Crea uno desde Investigations.</p>
          ) : (
            recentCases.map((c) => (
              <Link
                key={c.id}
                href={"/reports/" + c.id}
                className="rounded-xl border border-white/5 bg-[rgba(13,17,23,0.58)] p-5 backdrop-blur-md transition-all hover:border-cyan-400/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-400">{c.case_code}</p>
                    <h3 className="mt-1 text-lg font-bold text-white">{c.title}</h3>
                  </div>
                  <span className="text-sm font-bold" style={{ color: riskColors[c.risk_level] || "#8B93A7" }}>
                    {c.risk_level}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}