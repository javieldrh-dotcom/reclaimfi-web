"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "";

export default function EvaluationPage() {
  const [wallet, setWallet] = useState("");
  const [hash, setHash] = useState("");
  const [auditType, setAuditType] = useState("Blockchain");
  const [priority, setPriority] = useState("Media");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<RiskLevel>("");
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");

  useEffect(() => {
    async function loadCases() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      if (!cid) return;
      const { data: casesList } = await supabase.from("cases").select("id, case_code, title").eq("company_id", cid).order("created_at", { ascending: false });
      setCases(casesList ?? []);
    }
    loadCases();
  }, []);

  async function handleEvaluation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCaseId) {
      alert("Selecciona el caso al que pertenece esta evaluacion.");
      return;
    }
    setLoading(true);

    let risk: RiskLevel = "LOW";
    try {
      const res = await fetch("/api/intel-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "Wallet/Cuenta: " + wallet + ". Tipo de auditoria: " + auditType + ". Descripcion: " + description,
        }),
      });
      const json = await res.json();
      if (json.success) {
        risk = json.result.priority;
      }
    } catch (err) {
      console.error("[IA Error]", err);
    }

    setResult(risk);

    const { error } = await supabase.from("evaluations").insert([
      {
        wallet,
        hash,
        audit_type: auditType,
        priority,
        description,
        risk,
        case_id: selectedCaseId,
        created_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("[Supabase Error]", error);
      alert("Error guardando evaluacion");
      return;
    }

    alert("Evaluacion almacenada correctamente");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Motor de Evaluacion</h1>
            <p className="mt-1 text-sm text-gray-500">Audit Global Intelligence</p>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Analisis con IA
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-8 py-10">
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 backdrop-blur">
              <h2 className="text-2xl font-semibold">Nueva Evaluacion</h2>

              <form onSubmit={handleEvaluation} className="mt-10 space-y-6">
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4"
                >
                  <option value="">Selecciona el caso...</option>
                  {cases.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.case_code} - {c.title}</option>
                  ))}
                </select>
                {cases.length === 0 && (
                  <p className="text-sm text-yellow-400">No tienes casos de investigacion creados. Crea uno primero en el modulo de Investigaciones.</p>
                )}
                <input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="Wallet / Cuenta"
                  className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none focus:border-cyan-400"
                />
                <input
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Hash Documental"
                  className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none focus:border-cyan-400"
                />
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4"
                >
                  <option>Blockchain</option>
                  <option>AML/KYC</option>
                  <option>Forense Financiera</option>
                  <option>Documental</option>
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4"
                >
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Critica</option>
                </select>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripcion del caso..."
                  rows={5}
                  className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-cyan-400 px-6 py-4 font-semibold text-black hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {loading ? "Analizando con IA..." : "Iniciar Evaluacion"}
                </button>
              </form>
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 backdrop-blur">
              <h2 className="text-2xl font-semibold">Resultado Analitico</h2>
              <div className="mt-8">
                {result ? (
                  <div className="rounded-2xl border border-cyan-400/10 bg-black/30 p-6">
                    <p className="text-sm text-gray-500">Clasificacion generada por IA</p>
                    <h3 className="mt-4 text-3xl font-bold">{result}</h3>
                    <p className="mt-4 text-sm text-gray-400">Evaluacion preliminar basada en el contenido real ingresado.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
                    <p className="text-gray-500">Esperando evaluacion...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}