"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [usefulLife, setUsefulLife] = useState("5");
  const [salvageValue, setSalvageValue] = useState("0");
  const [message, setMessage] = useState("");

  async function loadAssets(cid: string) {
    const { data } = await supabase.from("fixed_assets").select("*, chart_of_accounts(account_name)").eq("company_id", cid).order("acquisition_date", { ascending: false });
    setAssets(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).eq("account_type", "ASSET").order("account_code");
        setAccounts(acc ?? []);
        await loadAssets(cid);
      }
    }
    load();
  }, []);
  function calculateDepreciation(asset: any) {
    const cost = asset.acquisition_cost;
    const salvage = asset.salvage_value || 0;
    const years = asset.useful_life_years;
    const acqDate = new Date(asset.acquisition_date);
    const today = new Date();
    const monthsElapsed = Math.max(0, (today.getFullYear() - acqDate.getFullYear()) * 12 + (today.getMonth() - acqDate.getMonth()));
    const monthlyDep = (cost - salvage) / (years * 12);
    const accumulated = Math.min(monthlyDep * monthsElapsed, cost - salvage);
    const bookValue = cost - accumulated;
    return { monthlyDep, accumulated, bookValue };
  }

  async function addAsset() {
    setMessage("");
    if (!companyId || !assetName || !acquisitionDate || !acquisitionCost) { setMessage("Completa todos los campos."); return; }

    const { error } = await supabase.from("fixed_assets").insert([{
      company_id: companyId,
      account_id: accountId || null,
      asset_name: assetName,
      acquisition_date: acquisitionDate,
      acquisition_cost: parseFloat(acquisitionCost),
      useful_life_years: parseFloat(usefulLife),
      salvage_value: parseFloat(salvageValue) || 0,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Activo registrado correctamente.");
    setAssetName(""); setAcquisitionDate(""); setAcquisitionCost("");
    if (companyId) await loadAssets(companyId);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%" };

  return (
    <div style={{ padding: 40, color: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Activos Fijos y Depreciacion</h1>

      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 500 }}>
        <input value={assetName} onChange={(e) => setAssetName(e.target.value)} style={inputStyle} placeholder="Nombre del activo" />
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inputStyle}>
          <option value="">Cuenta contable (opcional)</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} style={inputStyle} />
        <input type="number" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} style={inputStyle} placeholder="Costo de adquisicion" />
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} style={inputStyle} placeholder="Vida util (años)" />
          <input type="number" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} style={inputStyle} placeholder="Valor residual" />
        </div>
        <button onClick={addAsset} style={{ padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
          REGISTRAR ACTIVO
        </button>
        {message && <p style={{ color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>}
      </div>

      {assets.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Activos Registrados</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#7dd3fc", fontSize: 12 }}>
                <th style={{ padding: 8 }}>Activo</th>
                <th style={{ padding: 8 }}>Costo</th>
                <th style={{ padding: 8 }}>Dep. Mensual</th>
                <th style={{ padding: 8 }}>Dep. Acumulada</th>
                <th style={{ padding: 8 }}>Valor en Libros</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const d = calculateDepreciation(a);
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #1a3050" }}>
                    <td style={{ padding: 8 }}>{a.asset_name}</td>
                    <td style={{ padding: 8 }}>{a.acquisition_cost.toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{d.monthlyDep.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 8 }}>{d.accumulated.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{d.bookValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
