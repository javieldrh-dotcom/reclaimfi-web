"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";

export default function IgtfPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [igtfRate, setIgtfRate] = useState("3");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [message, setMessage] = useState("");

  async function loadDeclarations(cid: string) {
    const { data } = await supabase.from("igtf_declarations").select("*").eq("company_id", cid).order("transaction_date", { ascending: false });
    setDeclarations(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "EXPENSE"]);
        setAccounts(acc ?? []);
        const expAcc = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("igtf"));
        if (expAcc) setExpenseAccountId(expAcc.id);
        await loadDeclarations(cid);
      }
    }
    load();
  }, []);

  const rate = parseFloat(igtfRate) || 0;
  const amount = parseFloat(transactionAmount) || 0;
  const igtfAmount = amount * (rate / 100);

  async function registerIgtf() {
    setMessage("");
    if (!companyId || !description || !transactionAmount) { setMessage("Completa la descripcion y el monto."); return; }
    if (!expenseAccountId || !cashAccountId) { setMessage("Selecciona la Cuenta de Gasto IGTF y la Cuenta de Banco/Caja."); return; }

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "IGTF - " + description,
      entry_date: transactionDate,
      entry_number: nextNumber,
    }]).select("id").single();
    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: expenseAccountId, debit: igtfAmount, credit: 0 },
      { journal_entry_id: entry.id, account_id: cashAccountId, debit: 0, credit: igtfAmount },
    ]);

    const { error } = await supabase.from("igtf_declarations").insert([{
      company_id: companyId,
      transaction_date: transactionDate,
      description,
      transaction_amount: amount,
      currency,
      igtf_rate: rate,
      igtf_amount: igtfAmount,
      journal_entry_id: entry.id,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }

    setMessage("IGTF registrado (Nº" + nextNumber + "). Monto: " + igtfAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " " + currency + ". Asiento generado correctamente.");
    setDescription(""); setTransactionAmount("");
    await loadDeclarations(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="IGTF - Impuesto a las Grandes Transacciones Financieras" subtitle="Grava pagos en divisas/criptoactivos (3%) por Contribuyentes Especiales - Verificar tasa vigente en Gaceta Oficial" fullWidth>
      <div style={{ ...theme.cardStyle, marginBottom: 20, maxWidth: 700 }}>
        <p style={{ fontSize: 14, color: "#f87171", marginBottom: 10 }}>⚠ La tasa del IGTF puede ser modificada por el Ejecutivo Nacional mediante decreto. Verifica la tasa vigente antes de confiar en el valor por defecto.</p>
        <div style={{ display: "flex", gap: 6 }}>
          <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "EXPENSE")} value={expenseAccountId} onChange={setExpenseAccountId} placeholder="Cuenta de Gasto IGTF..." />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "ASSET")} value={cashAccountId} onChange={setCashAccountId} placeholder="Cuenta de Banco/Caja..." />
        </div>
      </div>

      <div style={{ maxWidth: 700 }}>
        <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} style={inputStyle} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Descripcion de la transaccion" />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input type="number" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} style={inputStyle} placeholder="Monto de la Transaccion" />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="USDT">USDT (Cripto)</option>
          </select>
          <input type="number" value={igtfRate} onChange={(e) => setIgtfRate(e.target.value)} style={inputStyle} placeholder="Tasa IGTF %" />
        </div>
        <div style={{ ...theme.cardStyle, marginTop: 16 }}>
          <p style={{ fontSize: 18 }}>Monto de IGTF a Retener/Pagar:</p>
          <p style={{ fontSize: 28, fontWeight: 900, ...theme.numberStyle, color: theme.accent }}>{igtfAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}</p>
        </div>
        <button onClick={registerIgtf} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR IGTF
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") || message.includes("Completa") || message.includes("Selecciona") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {declarations.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>IGTF Registrados</h2>
          {declarations.map((d) => (
            <div key={d.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 16 }}>
              {d.transaction_date} - {d.description} - Monto: {d.transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {d.currency} - IGTF ({d.igtf_rate}%): <span style={theme.numberStyle}>{d.igtf_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}