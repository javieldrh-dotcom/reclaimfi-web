"use client";
import { useState, useEffect } from "react";
import NeuralBackground from "@/app/components/NeuralBackground";
import { supabase } from "@/app/lib/supabase";
export default function TrackingPage() {
  const [wallet, setWallet] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [linkingCase, setLinkingCase] = useState(false);
  const [caseLinkMessage, setCaseLinkMessage] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [provisionAmount, setProvisionAmount] = useState("");
  const [provisionDescription, setProvisionDescription] = useState("");
  const [showProvisionForm, setShowProvisionForm] = useState(false);
  const [generatingProvision, setGeneratingProvision] = useState(false);
  const [provisionMessage, setProvisionMessage] = useState("");

  useEffect(() => {
    async function loadCompanies() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: ucs } = await supabase.from("user_companies").select("company_id, companies(id, name)").eq("user_id", userData.user.id);
      const list = (ucs ?? []).map((uc: any) => uc.companies).filter(Boolean);
      setCompanies(list);
      if (list.length > 0) setSelectedCompanyId(list[0].id);

      const { data: casesList } = await supabase.from("cases").select("id, case_code, title").order("created_at", { ascending: false });
      setCases(casesList ?? []);
    }
    loadCompanies();
  }, []);

  async function analyzeWallet() {
    if (!wallet.trim()) {
      setError("Ingresa una direccion de wallet.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/wallet-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "No se pudo analizar la wallet.");
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError("Error de conexion: " + e.message);
    }
    setLoading(false);
  }


  async function linkToCase() {
    if (!selectedCaseId || !data) {
      setCaseLinkMessage("Selecciona un caso primero.");
      return;
    }
    setLinkingCase(true);
    setCaseLinkMessage("");
    const { error } = await supabase.from("case_wallet_analyses").insert([{
      case_id: selectedCaseId,
      wallet_address: data.address,
      balance_btc: data.balanceBtc,
      tx_count: data.txCount,
      risk_level: data.analysis.riskLevel,
      ofac_sanctioned: data.ofacSanctioned || false,
      analysis_summary: data.analysis.behavior,
      recommendation: data.analysis.recommendation,
    }]);
    if (error) {
      setCaseLinkMessage("Error: " + error.message);
    } else {
      setCaseLinkMessage("Analisis vinculado al caso correctamente.");
    }
    setLinkingCase(false);
  }

  async function generateProvision() {
    if (!selectedCompanyId || !provisionAmount || !data) {
      setProvisionMessage("Selecciona una empresa e ingresa un monto.");
      return;
    }
    setGeneratingProvision(true);
    setProvisionMessage("");

    let { data: expenseAccount } = await supabase.from("chart_of_accounts").select("id").eq("company_id", selectedCompanyId).eq("account_name", "Perdida Estimada por Riesgo").maybeSingle();
    if (!expenseAccount) {
      const { data: newExpense } = await supabase.from("chart_of_accounts").insert([{ company_id: selectedCompanyId, account_code: "9001", account_name: "Perdida Estimada por Riesgo", account_type: "EXPENSE" }]).select("id").single();
      expenseAccount = newExpense;
    }

    let { data: liabilityAccount } = await supabase.from("chart_of_accounts").select("id").eq("company_id", selectedCompanyId).eq("account_name", "Provision por Contingencias").maybeSingle();
    if (!liabilityAccount) {
      const { data: newLiability } = await supabase.from("chart_of_accounts").insert([{ company_id: selectedCompanyId, account_code: "2901", account_name: "Provision por Contingencias", account_type: "LIABILITY" }]).select("id").single();
      liabilityAccount = newLiability;
    }

    if (!expenseAccount || !liabilityAccount) {
      setProvisionMessage("Error al crear las cuentas necesarias.");
      setGeneratingProvision(false);
      return;
    }

    const amount = parseFloat(provisionAmount) || 0;
    const desc = "Provision por riesgo detectado en wallet " + data.address + (data.ofacSanctioned ? " (SANCIONADA POR OFAC)" : " (Riesgo " + data.analysis.riskLevel + ")") + (provisionDescription ? " - " + provisionDescription : "");

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: selectedCompanyId,
      description: desc,
      entry_date: new Date().toISOString().slice(0, 10),
      currency: "USD",
      exchange_rate: 1,
      entry_number: Date.now(),
    }]).select("id").single();

    if (entryError || !entry) {
      setProvisionMessage("Error al crear el asiento: " + entryError?.message);
      setGeneratingProvision(false);
      return;
    }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: expenseAccount.id, debit: amount, credit: 0 },
      { journal_entry_id: entry.id, account_id: liabilityAccount.id, debit: 0, credit: amount },
    ]);

    setProvisionMessage("Provision contable generada correctamente por $" + amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ". Revisa el Libro Diario de la empresa seleccionada.");
    setGeneratingProvision(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10 relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-cyan-400">
              Wallet Tracking Center
            </h1>
            <p className="mt-4 text-gray-500">
              Analisis real de direcciones Bitcoin en blockchain, con evaluacion de riesgo por IA.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            TRACKING ENGINE
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-5 py-3 text-sm text-yellow-200">
          Esta herramienta consulta datos reales de la blockchain publica de Bitcoin. Actualmente solo soporta direcciones de Bitcoin (empiezan con 1, 3, o bc1). El analisis de IA es una guia de apoyo profesional, no un dictamen legal.
        </div>

        <div className="mt-6 rounded-3xl border border-white/5 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-semibold">
            Analisis de Direccion Bitcoin
          </h2>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="Ingresa una direccion de Bitcoin (ej. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none"
            />
            <button
              onClick={analyzeWallet}
              disabled={loading}
              className="rounded-2xl bg-cyan-400 px-8 py-4 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? "Consultando blockchain..." : "Analizar Wallet"}
            </button>
          </div>
          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>

        {data && (
          <div className="mt-10 grid gap-8">
            {data.ofacSanctioned && (
              <div className="rounded-3xl border-2 border-red-500 bg-red-500/20 p-8 animate-pulse">
                <h2 className="text-2xl font-black text-red-300">ALERTA: DIRECCION SANCIONADA POR OFAC</h2>
                <p className="mt-3 text-red-200">Esta direccion aparece en la lista oficial de sanciones del Departamento del Tesoro de EE.UU. (OFAC SDN List). Cualquier transaccion con esta wallet puede constituir una violacion de sanciones internacionales.</p>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-4">
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Nivel de Riesgo (IA)</p>
                <h2
                  className={
                    "mt-4 text-4xl font-bold " +
                    (data.analysis.riskLevel === "HIGH"
                      ? "text-red-400"
                      : data.analysis.riskLevel === "MEDIUM"
                      ? "text-yellow-400"
                      : "text-green-400")
                  }
                >
                  {data.analysis.riskLevel}
                </h2>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Balance Actual</p>
                <h2 className="mt-4 text-3xl font-bold text-cyan-300">{data.balanceBtc.toFixed(4)} BTC</h2>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Transacciones Totales</p>
                <h2 className="mt-4 text-3xl font-bold text-white">{data.txCount}</h2>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm text-gray-500">Tipo de Actividad (IA)</p>
                <h2 className="mt-4 text-2xl font-bold text-cyan-400">{data.analysis.activityType}</h2>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
              <p className="text-sm text-gray-500">Direccion Analizada</p>
              <p className="mt-4 break-all text-cyan-300">{data.address}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
                <p>Total historico recibido: {data.totalReceivedBtc.toFixed(4)} BTC</p>
                <p>Total historico enviado: {data.totalSentBtc.toFixed(4)} BTC</p>
              </div>
            </div>

            <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-8">
              <h2 className="text-2xl font-semibold text-red-300">
                Transacciones Recientes (datos reales)
              </h2>
              <div className="mt-6 grid gap-4">
                {data.recentTransactions.map((tx: any, index: number) => (
                  <div key={index} className="rounded-2xl border border-white/5 bg-black/30 p-5 flex justify-between">
                    <span>{tx.timestamp}</span>
                    <span className={tx.direction === "IN" ? "text-green-400" : "text-red-400"}>
                      {tx.direction === "IN" ? "Recibio" : "Envio"} {tx.valueBtc.toFixed(4)} BTC
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-8">
              <h2 className="text-2xl font-semibold text-cyan-300">Analisis de IA</h2>
              <p className="mt-4 text-gray-300"><strong>Comportamiento:</strong> {data.analysis.behavior}</p>
              {data.analysis.reasons.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm">Razones observadas:</p>
                  <ul className="mt-2 list-disc list-inside text-gray-300">
                    {data.analysis.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              <p className="mt-5 leading-8 text-gray-300">{data.analysis.recommendation}</p>
            </div>

            {cases.length > 0 && (
              <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 p-8">
                <h2 className="text-2xl font-semibold text-blue-300">Vincular a un Caso de Investigacion</h2>
                <p className="mt-3 text-gray-400 text-sm">Guarda este hallazgo como evidencia dentro de un caso, para incluirlo despues en el reporte forense unificado.</p>
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white">
                    <option value="">Selecciona un caso...</option>
                    {cases.map((c: any) => <option key={c.id} value={c.id}>{c.case_code} - {c.title}</option>)}
                  </select>
                  <button onClick={linkToCase} disabled={linkingCase || !selectedCaseId} className="rounded-xl bg-blue-400 px-6 py-3 font-semibold text-black disabled:opacity-50">
                    {linkingCase ? "Vinculando..." : "Vincular al Caso"}
                  </button>
                </div>
                {caseLinkMessage && <p className="mt-3 text-blue-200">{caseLinkMessage}</p>}
              </div>
            )}

            {(data.ofacSanctioned || data.analysis.riskLevel === "HIGH") && (
              <div className="rounded-3xl border border-orange-400/20 bg-orange-400/5 p-8">
                <h2 className="text-2xl font-semibold text-orange-300">Generar Provision Contable</h2>
                <p className="mt-3 text-gray-400 text-sm">Vincula este hallazgo de riesgo a una transaccion real de tu empresa, generando automaticamente el asiento de provision (pasivo contingente).</p>
                {companies.length === 0 ? (
                  <p className="mt-4 text-gray-500">No tienes empresas registradas.</p>
                ) : !showProvisionForm ? (
                  <button onClick={() => setShowProvisionForm(true)} className="mt-4 rounded-xl bg-orange-400 px-6 py-3 font-semibold text-black">
                    Generar Provision Contable
                  </button>
                ) : (
                  <div className="mt-4 space-y-4">
                    <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white">
                      {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" placeholder="Monto estimado de la contingencia (USD)" value={provisionAmount} onChange={(e) => setProvisionAmount(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white" />
                    <input placeholder="Nota adicional (opcional)" value={provisionDescription} onChange={(e) => setProvisionDescription(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white" />
                    <button onClick={generateProvision} disabled={generatingProvision} className="rounded-xl bg-orange-400 px-6 py-3 font-semibold text-black disabled:opacity-50">
                      {generatingProvision ? "Generando..." : "Confirmar y Generar Asiento"}
                    </button>
                  </div>
                )}
                {provisionMessage && <p className="mt-4 text-orange-200">{provisionMessage}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
