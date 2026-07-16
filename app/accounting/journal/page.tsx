"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
interface Account { id: string; account_code: string; account_name: string; }
interface Line { account_id: string; debit: string; credit: string; }

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [lines, setLines] = useState<Line[]>([{ account_id: "", debit: "", credit: "" }, { account_id: "", debit: "", credit: "" }]);
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  async function loadEntries(cid: string) {
    const { data } = await supabase
      .from("journal_entries")
      .select("id, description, entry_date, status, journal_lines(debit, credit, chart_of_accounts(account_code, account_name))")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(15);
    setEntries(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("company_id", cid).order("account_code");
        setAccounts(acc ?? []);
        await loadEntries(cid);
      }
    }
    load();
  }, []);

  function updateLine(i: number, f: keyof Line, v: string) { const u = [...lines]; u[i][f] = v; setLines(u); }
  function addLine() { setLines([...lines, { account_id: "", debit: "", credit: "" }]); }
  function totalDebit() { return lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0); }
  function totalCredit() { return lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0); }
  async function saveEntry() {
    setMessage("");
    if (!companyId) { setMessage("Sin empresa asociada."); return; }
    const d = totalDebit(); const c = totalCredit();
    if (d !== c || d === 0) { setMessage("El asiento no cuadra."); return; }
    const { data: entry, error: e1 } = await supabase.from("journal_entries").insert([{ company_id: companyId, description, entry_date: new Date().toISOString().slice(0,10), currency, exchange_rate: parseFloat(exchangeRate) || 1 }]).select("id").single();
    if (e1 || !entry) { setMessage("Error: " + e1?.message); return; }
    const rate = parseFloat(exchangeRate) || 1;
    const rows = lines.filter(l => l.account_id).map(l => ({ journal_entry_id: entry.id, account_id: l.account_id, debit: (parseFloat(l.debit) || 0) * rate, credit: (parseFloat(l.credit) || 0) * rate }));
    const { error: e2 } = await supabase.from("journal_lines").insert(rows);
    if (e2) { setMessage("Error: " + e2.message); return; }
    setMessage("Guardado correctamente.");
    setDescription("");
    setLines([{ account_id: "", debit: "", credit: "" }, { account_id: "", debit: "", credit: "" }]);
    if (companyId) await loadEntries(companyId);
  }

  async function voidEntry(entryId: string) {
    const reason = window.prompt("Motivo de la anulacion:");
    if (!reason) return;
    await supabase.from("journal_entries").update({ status: "VOIDED", voided_at: new Date().toISOString(), void_reason: reason }).eq("id", entryId);
    if (companyId) await loadEntries(companyId);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 8, color: "white", width: "100%" };

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Libro Diario</h1>
      {accounts.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="VES">VES (Bolivares)</option>
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
            </select>
            <input type="number" step="0.0001" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} style={inputStyle} placeholder="Tasa de cambio (1 si es moneda funcional)" />
          </div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Descripcion" />
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <select value={line.account_id} onChange={(e) => updateLine(idx, "account_id", e.target.value)} style={inputStyle}>
                <option value="">Cuenta</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
              </select>
              <input type="number" value={line.debit} onChange={(e) => updateLine(idx, "debit", e.target.value)} style={inputStyle} placeholder="Debe" />
              <input type="number" value={line.credit} onChange={(e) => updateLine(idx, "credit", e.target.value)} style={inputStyle} placeholder="Haber" />
            </div>
          ))}
          <button onClick={addLine} style={{ marginTop: 12, color: "#7dd3fc" }}>+ Linea</button>
          <p>Debe: {totalDebit()} | Haber: {totalCredit()}</p>
          <button onClick={saveEntry} style={{ marginTop: 12, padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>GUARDAR</button>
          {message && <p>{message}</p>}
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Asientos Recientes</h2>
          {entries.map((e) => (
            <div key={e.id} style={{ padding: 12, borderBottom: "1px solid #1a3050", opacity: e.status === "VOIDED" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>
                  {e.entry_date} - {e.description}
                  {e.status === "VOIDED" && <span style={{ color: "#f87171", marginLeft: 8, fontSize: 11 }}>[ANULADO]</span>}
                </span>
                {e.status === "ACTIVE" && (
                  <button onClick={() => voidEntry(e.id)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "4px 10px", borderRadius: 8, fontSize: 12 }}>
                    Anular
                  </button>
                )}
              </div>
              {(e.journal_lines ?? []).map((l: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9ca3af", marginTop: 4, paddingLeft: 12 }}>
                  <span>{l.chart_of_accounts?.account_code} - {l.chart_of_accounts?.account_name}</span>
                  <span>{l.debit > 0 ? "Debe: " + l.debit.toLocaleString() : "Haber: " + l.credit.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
