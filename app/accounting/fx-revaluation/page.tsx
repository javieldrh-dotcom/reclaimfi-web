"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";

export default function FxRevaluationPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [revaluations, setRevaluations] = useState<any[]>([]);
  const [revaluationDate, setRevaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [foreignCurrency, setForeignCurrency] = useState("VES");
  const [foreignAmount, setForeignAmount] = useState("");
  const [oldRate, setOldRate] = useState("");
  const [newRate, setNewRate] = useState("");
  const [gainAccountId, setGainAccountId] = useState("");
  const [lossAccountId, setLossAccountId] = useState("");
  const [message, setMessage] = useState("");

  async function loadRevaluations(cid: string) {
    const { data } = await supabase.from("fx_revaluations").select("*, chart_of_accounts(account_code, account_name)").eq("company_id", cid).order("revaluation_date", { ascending: false });
    setRevaluations(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "REVENUE", "EXPENSE"]);
        setAccounts(acc ?? []);
        const gainAcc = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("diferencia en cambio favorable"));
        if (gainAcc) setGainAccountId(gainAcc.id);
        const lossAcc = (acc ?? []).find((a: any) => a.account_name.toLowerCase() === "diferencia en cambio");
        if (lossAcc) setLossAccountId(lossAcc.id);
        await loadRevaluations(cid);
      }
    }
    load();
  }, []);

  const fAmount = parseFloat(foreignAmount) || 0;
  const oRate = parseFloat(oldRate) || 0;
  const nRate = parseFloat(newRate) || 0;
  const oldFunctionalValue = oRate > 0 ? fAmount / oRate : 0;
  const newFunctionalValue = nRate > 0 ? fAmount / nRate : 0;
  const differential = newFunctionalValue - oldFunctionalValue;

  async function registerRevaluation() {
    setMessage("");
    if (!companyId || !selectedAccountId || !foreignAmount || !oldRate || !newRate) { setMessage("Completa todos los campos."); return; }
    if (!gainAccountId || !lossAccountId) { setMessage("Selecciona las cuentas de Diferencia en Cambio (Ganancia y Perdida)."); return; }

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const account = accounts.find((a) => a.id === selectedAccountId);
    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Revaluacion Cambiaria - " + (account?.account_name ?? ""),
      entry_date: revaluationDate,
      entry_number: nextNumber,
    }]).select("id").single();
    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const isGain = differential >= 0;
    const contraAccountId = isGain ? gainAccountId : lossAccountId;
    const diffAbs = Math.abs(differential);

    const isAssetOrExpense = account?.account_type === "ASSET" || account?.account_type === "EXPENSE";
    const lines = isGain
      ? (isAssetOrExpense
          ? [{ journal_entry_id: entry.id, account_id: selectedAccountId, debit: diffAbs, credit: 0 }, { journal_entry_id: entry.id, account_id: contraAccountId, debit: 0, credit: diffAbs }]
          : [{ journal_entry_id: entry.id, account_id: contraAccountId, debit: 0, credit: diffAbs }, { journal_entry_id: entry.id, account_id: selectedAccountId, debit: diffAbs, credit: 0 }])
      : (isAssetOrExpense
          ? [{ journal_entry_id: entry.id, account_id: contraAccountId, debit: diffAbs, credit: 0 }, { journal_entry_id: entry.id, account_id: selectedAccountId, debit: 0, credit: diffAbs }]
          : [{ journal_entry_id: entry.id, account_id: selectedAccountId, debit: 0, credit: diffAbs }, { journal_entry_id: entry.id, account_id: contraAccountId, debit: diffAbs, credit: 0 }]);

    await supabase.from("journal_lines").insert(lines);

    const { error } = await supabase.from("fx_revaluations").insert([{
      company_id: companyId,
      revaluation_date: revaluationDate,
      bcv_rate: nRate,
      account_id: selectedAccountId,
      foreign_currency_balance: fAmount,
      old_functional_value: oldFunctionalValue,
      new_functional_value: newFunctionalValue,
      differential,
      journal_entry_id: entry.id,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }

    setMessage("Revaluacion registrada (Nº" + nextNumber + "). " + (isGain ? "Ganancia" : "Perdida") + " cambiaria: " + diffAbs.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    setForeignAmount(""); setOldRate(""); setNewRate("");
    await loadRevaluations(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Revaluacion Cambiaria" subtitle="Ajusta partidas monetarias en moneda extranjera (VES u otra) segun tasa BCV - Genera diferencial en la moneda funcional (USD)" fullWidth>
      <div style={{ ...theme.cardStyle, marginBottom: 20, maxWidth: 700 }}>
        <p style={{ fontSize: 14, color: theme.accent, marginBottom: 10 }}>Cuentas de Diferencia en Cambio</p>
        <div style={{ display: "flex", gap: 6 }}>
          <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "REVENUE")} value={gainAccountId} onChange={setGainAccountId} placeholder="Cuenta de Ganancia Cambiaria..." />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "EXPENSE")} value={lossAccountId} onChange={setLossAccountId} placeholder="Cuenta de Perdida Cambiaria..." />
        </div>
      </div>

      <div style={{ maxWidth: 700 }}>
        <input type="date" value={revaluationDate} onChange={(e) => setRevaluationDate(e.target.value)} style={inputStyle} />
        <label style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginTop: 10, display: "block" }}>Cuenta Monetaria a Revaluar</label>
        <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "ASSET" || a.account_type === "LIABILITY")} value={selectedAccountId} onChange={setSelectedAccountId} placeholder="Buscar cuenta..." />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <select value={foreignCurrency} onChange={(e) => setForeignCurrency(e.target.value)} style={inputStyle}>
            <option value="VES">VES (Bolivares)</option>
            <option value="EUR">EUR</option>
            <option value="COP">COP</option>
          </select>
          <input type="number" value={foreignAmount} onChange={(e) => setForeignAmount(e.target.value)} style={inputStyle} placeholder={"Monto en " + foreignCurrency} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="number" value={oldRate} onChange={(e) => setOldRate(e.target.value)} style={inputStyle} placeholder="Tasa BCV Anterior" />
          <input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} style={inputStyle} placeholder="Tasa BCV Actual" />
        </div>

        {foreignAmount && oldRate && newRate && (
          <div style={{ ...theme.cardStyle, marginTop: 16 }}>
            <p style={{ fontSize: 16 }}>Valor Anterior (USD): <span style={theme.numberStyle}>{oldFunctionalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
            <p style={{ fontSize: 16, marginTop: 4 }}>Valor Nuevo (USD): <span style={theme.numberStyle}>{newFunctionalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
            <p style={{ fontSize: 22, fontWeight: 900, marginTop: 10, color: differential >= 0 ? "#4ade80" : "#f87171" }}>
              {differential >= 0 ? "Ganancia" : "Perdida"} Cambiaria: <span style={theme.numberStyle}>{Math.abs(differential).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        )}

        <button onClick={registerRevaluation} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR REVALUACION
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") || message.includes("Completa") || message.includes("Selecciona") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {revaluations.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Revaluaciones Registradas</h2>
          {revaluations.map((r) => (
            <div key={r.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 16 }}>
              {r.revaluation_date} - {r.chart_of_accounts?.account_name} - Tasa: {r.bcv_rate} - Diferencial: <span style={{ ...theme.numberStyle, color: r.differential >= 0 ? "#4ade80" : "#f87171" }}>{r.differential.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}