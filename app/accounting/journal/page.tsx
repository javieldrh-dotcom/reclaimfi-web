"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";
interface Account { id: string; account_code: string; account_name: string; }
interface Line { account_id: string; debit: string; credit: string; }
export default function JournalPage() {
  const theme = getVerticalTheme("accounting");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [currencyDoc, setCurrencyDoc] = useState("USD");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [lines, setLines] = useState<Line[]>([{ account_id: "", debit: "", credit: "" }, { account_id: "", debit: "", credit: "" }]);
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  async function loadEntries(cid: string) {
    const { data: entriesData, error: entriesError } = await supabase
      .from("journal_entries")
      .select("id, description, entry_date, status")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(15);

    if (entriesError || !entriesData) { console.error("Error cargando asientos:", entriesError); setEntries([]); return; }
    if (entriesData.length === 0) { setEntries([]); return; }

    const entryIds = entriesData.map((e: any) => e.id);
    const { data: linesData } = await supabase
      .from("journal_lines")
      .select("journal_entry_id, account_id, debit, credit")
      .in("journal_entry_id", entryIds);

    const accountIds = Array.from(new Set((linesData ?? []).map((l: any) => l.account_id)));
    const { data: accountsData } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name")
      .in("id", accountIds);

    const accountsById: Record<string, any> = {};
    (accountsData ?? []).forEach((a: any) => { accountsById[a.id] = a; });

    const enrichedEntries = entriesData.map((e: any) => ({
      ...e,
      journal_lines: (linesData ?? [])
        .filter((l: any) => l.journal_entry_id === e.id)
        .map((l: any) => ({ ...l, chart_of_accounts: accountsById[l.account_id] })),
    }));

    setEntries(enrichedEntries);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        setCurrencyDoc(companyData?.functional_currency ?? "USD");
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
  function downloadPdf() {
    const items = entries.filter((e) => e.status === "ACTIVE").flatMap((e: any) =>
      (e.journal_lines ?? []).map((l: any) => ({
        name: e.entry_date + " - " + e.description + " (" + (l.chart_of_accounts?.account_code ?? "") + " " + (l.chart_of_accounts?.account_name ?? "") + ")",
        amount: l.debit > 0 ? l.debit : l.credit,
        debitAmount: l.debit,
        creditAmount: l.credit,
      }))
    );
    const totalD = items.reduce((s, i) => s + (i.debitAmount || 0), 0);
    const totalC = items.reduce((s, i) => s + (i.creditAmount || 0), 0);
    const doc = generateFinancialStatementPdf(
      "LIBRO DIARIO",
      companyName,
      [{ title: "Asientos Contables", items, total: 0, totalLabel: "Totales", totalDebit: totalD, totalCredit: totalC }],
      "Total General",
      totalD,
      currencyDoc
    );
    doc.save("libro-diario.pdf");
  }
  const inputStyle = theme.inputStyle;

  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Libro Diario"
      fullWidth
      actions={entries.length > 0 ? (
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      ) : undefined}
    >
      {accounts.length > 0 && (
        <div style={theme.cardStyle}>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="VES">VES (Bolivares)</option>
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
            </select>
            <input type="number" step="0.0001" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} style={inputStyle} placeholder="Tasa de cambio" />
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
          <button onClick={addLine} style={{ marginTop: 12, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}>+ Linea</button>
          <p style={{ ...theme.numberStyle, marginTop: 12 }}>Debe: {totalDebit().toLocaleString()} | Haber: {totalCredit().toLocaleString()}</p>
          <button onClick={saveEntry} style={{ ...theme.buttonStyle, marginTop: 12 }}>GUARDAR</button>
          {message && <p style={{ marginTop: 8, color: message.includes("Error") ? "#F87171" : theme.accent }}>{message}</p>}
        </div>
      )}
      {entries.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontFamily: theme.titleStyle.fontFamily, fontWeight: 700 }}>Asientos Recientes</h2>
          {entries.map((e) => (
            <div key={e.id} style={{ ...theme.cardStyle, marginTop: 12, opacity: e.status === "VOIDED" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 22 }}>
                  {e.entry_date} - {e.description}
                  {e.status === "VOIDED" && <span style={{ color: "#F87171", marginLeft: 8, fontSize: 16 }}>[ANULADO]</span>}
                </span>
                {e.status === "ACTIVE" && (
                  <button onClick={() => voidEntry(e.id)} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "4px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                    Anular
                  </button>
                )}
              </div>
              {(e.journal_lines ?? []).map((l: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#B0B8C8", marginTop: 6, paddingLeft: 12 }}>
                  <span>{l.chart_of_accounts?.account_code} - {l.chart_of_accounts?.account_name}</span>
                  <span style={theme.numberStyle}>{l.debit > 0 ? "Debe: " + l.debit.toLocaleString() : "Haber: " + l.credit.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
