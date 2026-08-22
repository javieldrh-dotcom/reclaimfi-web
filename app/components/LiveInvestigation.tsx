import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface CaseItem {
  id: string;
  case_code: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function LiveInvestigation() {
  const [input, setInput] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const generateCaseCode = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `AGI-2026-${random}`;
  };

  const loadCases = async (cid: string) => {
    const { data } = await supabase
      .from("cases")
      .select("id, case_code, title, status, priority, created_at")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setCases(data);
  };

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

  const startInvestigation = async () => {
    if (!input.trim()) {
      alert("Ingresa una wallet, hash, o descripcion del objetivo");
      return;
    }
    if (!companyId) return;
    setLoading(true);
    const caseCode = generateCaseCode();
    await supabase.from("cases").insert([{
      company_id: companyId,
      case_code: caseCode,
      title: input.trim(),
      description: "Investigacion rapida iniciada desde Live Investigation",
      case_type: "BLOCKCHAIN",
      priority: "MEDIUM",
      status: "OPEN",
      risk_level: "MEDIUM",
    }]);
    setInput("");
    await loadCases(companyId);
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-5xl font-black text-cyan-300">INVESTIGACION RAPIDA</h1>
      <p className="mt-4 text-gray-400">Crea un caso real de investigacion en segundos, integrado con el resto de la plataforma.</p>

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ingresa wallet, hash, transaccion, o descripcion del objetivo"
          className="w-full rounded-lg border border-cyan-400/20 bg-black/40 p-4 text-cyan-300 outline-none"
        />
        <button
          onClick={startInvestigation}
          disabled={loading || !companyId}
          className="mt-6 rounded-lg bg-cyan-500 px-8 py-4 font-bold text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? "CREANDO..." : "INICIAR INVESTIGACION"}
        </button>
      </div>

      <div className="mt-10 space-y-4">
        {cases.map((item) => (
          <div key={item.id} className="rounded-xl border border-cyan-400/20 bg-black/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-400">{item.case_code}</p>
                <h2 className="mt-2 text-xl font-bold text-white">{item.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-green-400">{item.status}</p>
                <p className="mt-2 text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}