"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function EvaluationPage() {

  const [wallet, setWallet] = useState("");
  const [hash, setHash] = useState("");
  const [auditType, setAuditType] = useState("Blockchain");
  const [priority, setPriority] = useState("Media");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");

  async function handleEvaluation(e: React.FormEvent) {
    e.preventDefault();

    let risk = "";

    if (
      wallet.toLowerCase().includes("risk") ||
      description.toLowerCase().includes("suspicious")
    ) {
      risk = "🔴 Alto Riesgo";
    } else if (
      description.toLowerCase().includes("review")
    ) {
      risk = "🟡 Revisión Manual";
    } else {
      risk = "🟢 Riesgo Bajo";
    }

    setResult(risk);

    const { error } = await supabase
      .from("evaluations")
      .insert([
        {
          wallet,
          hash,
          audit_type: auditType,
          priority,
          description,
          risk,
        },
      ]);

    if (error) {
      console.error(error);
      alert("Error guardando evaluación");
    } else {
      alert("Evaluación almacenada correctamente");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur">

        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-6">

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Evaluation Engine
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Audit Global Intelligence
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Sistema Analítico
          </div>

        </div>

      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1400px] px-8 py-10">

        <div className="grid gap-8 xl:grid-cols-3">

          {/* FORM */}
          <div className="xl:col-span-2">

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 backdrop-blur">

              <h2 className="text-2xl font-semibold">
                Nueva Evaluación
              </h2>

              <p className="mt-2 text-gray-500">
                Ingrese información para análisis institucional.
              </p>

              <form
                onSubmit={handleEvaluation}
                className="mt-10 space-y-6"
              >

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Wallet / Cuenta
                  </label>

                  <input
                    type="text"
                    placeholder="0xA84B..."
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Hash Documental
                  </label>

                  <input
                    type="text"
                    placeholder="SHA256 / TX HASH"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Tipo de Auditoría
                  </label>

                  <select
                    value={auditType}
                    onChange={(e) => setAuditType(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
                  >
                    <option>Blockchain</option>
                    <option>AML/KYC</option>
                    <option>Forense Financiera</option>
                    <option>Documental</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Prioridad
                  </label>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
                  >
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Descripción
                  </label>

                  <textarea
                    rows={5}
                    placeholder="Detalle del caso..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-400 px-6 py-4 font-semibold text-black transition hover:scale-[1.02]"
                >
                  Iniciar Evaluación
                </button>

              </form>

            </div>

          </div>

          {/* RESULT */}
          <div>

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 backdrop-blur">

              <h2 className="text-2xl font-semibold">
                Resultado Analítico
              </h2>

              <div className="mt-8">

                {result ? (
                  <div className="rounded-2xl border border-cyan-400/10 bg-black/30 p-6">

                    <p className="text-sm text-gray-500">
                      Clasificación generada
                    </p>

                    <h3 className="mt-4 text-3xl font-bold">
                      {result}
                    </h3>

                    <p className="mt-4 text-sm text-gray-400">
                      Evaluación preliminar generada por AGI.
                    </p>

                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-6">

                    <p className="text-gray-500">
                      Esperando evaluación...
                    </p>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
} //

