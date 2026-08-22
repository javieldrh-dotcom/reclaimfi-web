"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function InvestigationsPage() {
  const [wallet, setWallet] = useState("");
  const [risk, setRisk] = useState("HIGH");
  const [priority, setPriority] = useState("CRITICAL");
  const [investigator, setInvestigator] = useState("");
  const [notes, setNotes] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);

  const generateCaseCode = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `AGI-2026-${random}`;
  };

  async function loadCases(cid: string) {
    const { data } = await supabase
      .from("cases")
      .select("*")
      .eq("company_id", cid)
      .order("created_at", { ascending: false });
    setCases(data || []);
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadCases(cid);
    }
    init();
  }, []);

  async function createCase() {
    if (!wallet) {
      alert("La wallet o identificador del objetivo es requerido");
      return;
    }
    if (!companyId) return;

    const { error } = await supabase.from("cases").insert([{
      company_id: companyId,
      case_code: generateCaseCode(),
      title: wallet,
      description: (investigator ? "Investigador: " + investigator + ". " : "") + notes,
      case_type: "BLOCKCHAIN",
      priority,
      status: "OPEN",
      risk_level: risk,
    }]);

    if (error) {
      console.error(error);
      alert("Error al crear la investigacion");
    } else {
      alert("Investigacion creada");
      setWallet("");
      setNotes("");
      setInvestigator("");
      await loadCases(companyId);
    }
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-yellow-400">Investigaciones</h1>
            <p className="mt-4 text-gray-500">Flujos institucionales de investigacion forense.</p>
          </div>
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-yellow-300">
            UNIDAD FORENSE
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-semibold">Abrir Investigacion</h2>

          <div className="mt-8 grid gap-5">
            <input
              type="text"
              placeholder="Direccion de Wallet u objetivo de investigacion"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />
            <input
              type="text"
              placeholder="Investigador asignado"
              value={investigator}
              onChange={(e) => setInvestigator(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />
            <textarea
              placeholder="Notas de la investigacion..."
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
                <option value="HIGH">Riesgo Alto</option>
                <option value="MEDIUM">Riesgo Medio</option>
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
              >
                <option value="CRITICAL">Critica</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
              </select>
            </div>
            <button
              onClick={createCase}
              className="rounded-2xl bg-yellow-400 px-8 py-4 font-semibold text-black transition hover:bg-yellow-300"
            >
              Crear Investigacion
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6">
          {cases.map((item) => (
            <div key={item.id} className="rounded-3xl border border-yellow-400/10 bg-yellow-400/5 p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-cyan-400">{item.case_code}</p>
                  <h2 className="break-all text-xl font-semibold text-cyan-300">{item.title}</h2>
                  <Link
                    href={`/reports/${item.id}`}
                    className="mt-3 inline-block rounded-full bg-cyan-500 px-5 py-2 text-xs font-bold text-black hover:bg-cyan-400"
                  >
                    VER INFORME PROFESIONAL
                  </Link>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">{item.risk_level}</div>
                  <div className="rounded-xl bg-yellow-500/20 px-4 py-2 text-sm text-yellow-300">{item.priority}</div>
                  <div className="rounded-xl bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">{item.status}</div>
                </div>
              </div>
              {item.description && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-black/30 p-5 text-gray-300">
                  {item.description}
                </div>
              )}
              <div className="mt-6 text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}