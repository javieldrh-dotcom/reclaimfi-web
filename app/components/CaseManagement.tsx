"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createCase, getCases } from "../lib/supabaseCases";
import { getActiveCompanyContext } from "../lib/activeCompany";
import { logLedgerEvent } from "../lib/logLedgerEvent";

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

const CASE_TYPES = ["FINANCIAL", "BLOCKCHAIN", "DOCUMENTAL", "PROCUREMENT"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
// Clasificacion de sector para casos no-BLOCKCHAIN (auditoria financiera):
// permite distinguir auditorias del sector petrolero/PDVSA y municipales
// de los casos corporativos generales (ver migracion
// 2026-10-10-cases-sector.sql).
const SECTORS = ["CORPORATIVO", "PETROLERO", "MUNICIPAL"];

export default function CaseManagement() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseType, setCaseType] = useState("FINANCIAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [sector, setSector] = useState("CORPORATIVO");

  async function loadCases() {
    setLoading(true);
    const { companyId } = await getActiveCompanyContext();
    if (!companyId) {
      setCases([]);
      setLoading(false);
      return;
    }
    const data = await getCases(companyId);
    setCases(data || []);
    setLoading(false);
  }

  async function handleCreateCase() {
    if (!title) return;
    try {
      setCreating(true);
      const { companyId } = await getActiveCompanyContext();
      if (!companyId) {
        console.error("No se pudo resolver la empresa activa; no se creo el caso.");
        return;
      }
      const caseCode = "AGI-" + Math.floor(Math.random() * 999999);
      const [created] = await createCase({
        company_id: companyId,
        case_code: caseCode,
        title,
        description,
        case_type: caseType,
        priority,
        status: "OPEN",
        risk_level: riskLevel,
        sector: caseType === "BLOCKCHAIN" ? null : sector,
      });
      if (created?.id) {
        await logLedgerEvent("rf.case.created", created.id, {
          case_code: caseCode,
          case_type: caseType,
          company_id: companyId,
          sector: caseType === "BLOCKCHAIN" ? null : sector,
        });
      }
      setTitle("");
      setDescription("");
      setCaseType("FINANCIAL");
      setPriority("MEDIUM");
      setRiskLevel("MEDIUM");
      setSector("CORPORATIVO");
      await loadCases();
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const selectStyle = "rounded-2xl border border-blue-500/20 bg-black/40 px-6 py-5 text-white outline-none transition-all focus:border-blue-400";

  return (
    <div>
      <div className="rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-blue-300">GESTION DE CASOS</h1>
            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">
              Sistema de gestion de casos de investigacion, integrado con auditoria forense e inteligencia financiera.
            </p>
          </div>
          <div className="rounded-3xl border border-blue-500/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(59,130,246,0.15)]">
            <p className="text-xs tracking-[0.35em] text-blue-400">CASOS REGISTRADOS</p>
            <h2 className="mt-4 text-5xl font-black text-blue-300">{cases.length}</h2>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-8">
        <h2 className="text-3xl font-black text-blue-300">CREAR NUEVO CASO</h2>
        <div className="mt-8 grid gap-6">
          <input
            type="text"
            placeholder="Titulo del caso"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={selectStyle}
          />
          <textarea
            placeholder="Descripcion del caso"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={selectStyle}
          />
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs tracking-[0.2em] text-gray-400">TIPO DE CASO</label>
              <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className={selectStyle + " w-full"}>
                {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs tracking-[0.2em] text-gray-400">PRIORIDAD</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectStyle + " w-full"}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs tracking-[0.2em] text-gray-400">NIVEL DE RIESGO</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={selectStyle + " w-full"}>
                {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {caseType !== "BLOCKCHAIN" && (
            <div>
              <label className="mb-2 block text-xs tracking-[0.2em] text-gray-400">SECTOR</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectStyle + " w-full md:w-1/3"}>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={handleCreateCase}
            disabled={creating}
            className="rounded-2xl bg-blue-500 px-8 py-5 text-lg font-black tracking-[0.15em] text-black transition-all hover:bg-blue-400 disabled:opacity-50"
          >
            {creating ? "CREANDO..." : "CREAR CASO"}
          </button>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-blue-500/20 bg-[#0d1117]/95 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-blue-300">CASOS DE INVESTIGACION</h2>
            <p className="mt-3 text-gray-500">Datos reales de la base de datos</p>
          </div>
        </div>

        <div className="mt-10 space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-blue-500/10 bg-black/30 p-8 text-center text-gray-400">Cargando casos...</div>
          ) : cases.length === 0 ? (
            <div className="rounded-2xl border border-blue-500/10 bg-black/30 p-8 text-center text-gray-400">No hay casos registrados</div>
          ) : (
            cases.map((item) => (
              <div key={item.id} className="rounded-2xl border border-blue-500/10 bg-black/30 p-6 transition-all hover:border-blue-400/20 hover:bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-blue-500/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-blue-300">{item.case_code}</span>
                      <span className="text-sm text-gray-500">{item.case_type}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-white">{item.title}</h3>
                    <p className="mt-3 max-w-4xl text-gray-400">{item.description}</p>
                  </div>
                  <div className="flex gap-4">
                    <span className="rounded-full bg-yellow-500/20 px-5 py-3 text-xs font-black tracking-[0.2em] text-yellow-300">{item.priority}</span>
                    <span className="rounded-full bg-green-500/20 px-5 py-3 text-xs font-black tracking-[0.2em] text-green-300">{item.status}</span>
                  </div>
                </div>

                {/* Siguientes pasos directos para este caso, para no tener
                    que ir a otra pagina y volver a buscarlo en un
                    dropdown. */}
                <div className="mt-5 flex flex-wrap gap-3 border-t border-blue-500/10 pt-5">
                  <Link
                    href={"/reports/" + item.id}
                    className="rounded-xl border border-cyan-400/30 px-5 py-3 text-xs font-bold tracking-[0.1em] text-cyan-300 transition-all hover:bg-cyan-500/10"
                  >
                    Ver Reporte &rarr;
                  </Link>
                  {item.case_type !== "BLOCKCHAIN" && (
                    <Link
                      href={"/reports/" + item.id + "/reconstruct"}
                      className="rounded-xl border border-green-400/30 px-5 py-3 text-xs font-bold tracking-[0.1em] text-green-300 transition-all hover:bg-green-500/10"
                    >
                      Reconstruir Contabilidad &rarr;
                    </Link>
                  )}
                  <Link
                    href={(item.case_type === "BLOCKCHAIN" ? "/dashboard/audit/crypto" : "/dashboard/audit/financiero") + "?case=" + item.id}
                    className="rounded-xl border border-purple-400/30 px-5 py-3 text-xs font-bold tracking-[0.1em] text-purple-300 transition-all hover:bg-purple-500/10"
                  >
                    Ver en Auditoria &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}