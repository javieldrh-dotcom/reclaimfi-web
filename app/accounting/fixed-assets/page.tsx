"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";

export default function FixedAssetsPage() {
  const theme = getVerticalTheme("accounting");
  const [assets, setAssets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [assetAccountId, setAssetAccountId] = useState("");
  const [accumulatedDepAccountId, setAccumulatedDepAccountId] = useState("");
  const [depExpenseAccountId, setDepExpenseAccountId] = useState("");
  const [offsetAccountId, setOffsetAccountId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionCurrency, setAcquisitionCurrency] = useState("USD");
  const [acquisitionExchangeRate, setAcquisitionExchangeRate] = useState("1");
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
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "EXPENSE"]);
        setAccounts(acc ?? []);
        await loadAssets(cid);
      }
    }
    load();
  }, []);

  async function createNewAccount(type: string, target: string) {
    const name = window.prompt("Nombre de la nueva cuenta:");
    if (!name || !companyId) return;
    const prefix = type === "ASSET" ? "1199" : type === "LIABILITY" ? "2199" : "5199";
    const { data: newAcc, error } = await supabase.from("chart_of_accounts").insert([{
      account_code: prefix + "-" + Date.now().toString().slice(-4),
      account_name: name,
      account_type: type,
      company_id: companyId,
    }]).select("id, account_code, account_name, account_type").single();
    if (error || !newAcc) { alert("Error al crear cuenta: " + error?.message); return; }
    setAccounts((prev) => [...prev, newAcc]);
    if (target === "asset") setAssetAccountId(newAcc.id);
    if (target === "accdep") setAccumulatedDepAccountId(newAcc.id);
    if (target === "depexp") setDepExpenseAccountId(newAcc.id);
    if (target === "offset") setOffsetAccountId(newAcc.id);
  }

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

  async function fetchBcvRate() {
    setMessage("Consultando tasa BCV...");
    try {
      const res = await fetch("/api/bcv-rate");
      const json = await res.json();
      if (!json.success) { setMessage("No se pudo consultar la tasa BCV: " + json.error); return; }
      setAcquisitionCurrency("VES");
      setAcquisitionExchangeRate(String(json.rate));
      setMessage("Tasa BCV de hoy aplicada: " + json.rate + " (" + json.source + ")");
    } catch (err: any) {
      setMessage("Error al consultar la tasa: " + err.message);
    }
  }

  async function addAsset() {
    setMessage("");
    if (!companyId || !assetName || !acquisitionDate || !acquisitionCost) { setMessage("Completa todos los campos."); return; }
    if (!assetAccountId || !offsetAccountId) { setMessage("Selecciona la Cuenta de Activo Fijo y la Contrapartida."); return; }

    const fxRate = parseFloat(acquisitionExchangeRate) || 1;
    const cost = parseFloat(acquisitionCost) * fxRate;
    const { data: lastJournalEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const journalNextNumber = (lastJournalEntry?.entry_number || 0) + 1;
    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Adquisicion de Activo Fijo - " + assetName,
      entry_date: acquisitionDate,
      entry_number: journalNextNumber,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: assetAccountId, debit: cost, credit: 0 },
      { journal_entry_id: entry.id, account_id: offsetAccountId, debit: 0, credit: cost },
    ]);

    const { error } = await supabase.from("fixed_assets").insert([{
      company_id: companyId,
      account_id: assetAccountId,
      asset_name: assetName,
      acquisition_date: acquisitionDate,
      acquisition_cost: cost,
      useful_life_years: parseFloat(usefulLife),
      salvage_value: parseFloat(salvageValue) || 0,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Activo registrado y asiento de adquisicion generado correctamente.");
    setAssetName(""); setAcquisitionDate(""); setAcquisitionCost("");
    if (companyId) await loadAssets(companyId);
  }

  async function postDepreciation(asset: any) {
    if (!companyId) return;
    if (!accumulatedDepAccountId || !depExpenseAccountId) { alert("Selecciona la Cuenta de Depreciacion Acumulada y la de Gasto de Depreciacion antes de contabilizar."); return; }
    const d = calculateDepreciation(asset);
    const today = new Date().toISOString().slice(0, 10);

    const { error: depError } = await supabase.from("depreciation_entries").insert([{
      fixed_asset_id: asset.id,
      period_date: today,
      monthly_depreciation: d.monthlyDep,
      accumulated_depreciation: d.accumulated,
      book_value: d.bookValue,
    }]);
    const { data: lastJournalEntry2 } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const journalNextNumber2 = (lastJournalEntry2?.entry_number || 0) + 1;
    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Depreciacion del Mes - " + asset.asset_name,
      entry_date: today,
      entry_number: journalNextNumber2,
    }]).select("id").single();
    if (entryError || !entry) { alert("Error al crear asiento: " + entryError?.message); return; }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: depExpenseAccountId, debit: d.monthlyDep, credit: 0 },
      { journal_entry_id: entry.id, account_id: accumulatedDepAccountId, debit: 0, credit: d.monthlyDep },
    ]);

    alert("Depreciacion del mes contabilizada correctamente: " + d.monthlyDep.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    if (companyId) await loadAssets(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Activos Fijos y Depreciacion" subtitle="Vinculado a contabilidad - genera asiento en adquisicion y al contabilizar depreciacion" fullWidth>
      <div style={{ ...theme.cardStyle, marginBottom: 20, maxWidth: 900 }}>
        <p style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Cuentas Contables (requeridas)</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "ASSET")} value={assetAccountId} onChange={setAssetAccountId} placeholder="Cuenta de Activo Fijo..." />
            <button onClick={() => createNewAccount("ASSET", "asset")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "ASSET")} value={accumulatedDepAccountId} onChange={setAccumulatedDepAccountId} placeholder="Depreciacion Acumulada..." />
            <button onClick={() => createNewAccount("ASSET", "accdep")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "EXPENSE")} value={depExpenseAccountId} onChange={setDepExpenseAccountId} placeholder="Gasto de Depreciacion..." />
            <button onClick={() => createNewAccount("EXPENSE", "depexp")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "LIABILITY" || a.account_type === "ASSET")} value={offsetAccountId} onChange={setOffsetAccountId} placeholder="Contrapartida de Compra..." />
            <button onClick={() => createNewAccount("LIABILITY", "offset")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        <input value={assetName} onChange={(e) => setAssetName(e.target.value)} style={inputStyle} placeholder="Nombre del activo" />
        <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <select value={acquisitionCurrency} onChange={(e) => setAcquisitionCurrency(e.target.value)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="VES">VES (Bolivares)</option>
          </select>
          <input type="number" step="0.0001" value={acquisitionExchangeRate} onChange={(e) => setAcquisitionExchangeRate(e.target.value)} style={inputStyle} placeholder="Tasa de Cambio" />
            <button onClick={fetchBcvRate} type="button" style={{ padding: "0 14px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Tasa BCV Hoy</button>
        </div>
        <input type="number" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Costo de adquisicion" />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="number" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} style={inputStyle} placeholder="Vida util (años)" />
          <input type="number" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} style={inputStyle} placeholder="Valor residual" />
        </div>
        <button onClick={addAsset} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR ACTIVO
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") || message.includes("Selecciona") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {assets.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Activos Registrados</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 15, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Activo</th>
                <th style={{ padding: 10 }}>Costo</th>
                <th style={{ padding: 10 }}>Dep. Mensual</th>
                <th style={{ padding: 10 }}>Dep. Acumulada</th>
                <th style={{ padding: 10 }}>Valor en Libros</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const d = calculateDepreciation(a);
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 18 }}>{a.asset_name}</td>
                    <td style={{ padding: 10, fontSize: 18, ...theme.numberStyle }}>{a.acquisition_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10, fontSize: 18, ...theme.numberStyle }}>{d.monthlyDep.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10, fontSize: 18, ...theme.numberStyle }}>{d.accumulated.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10, fontWeight: 700, fontSize: 18, ...theme.numberStyle }}>{d.bookValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => postDepreciation(a)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                        Contabilizar Depreciacion
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </VerticalPageLayout>
  );
}
