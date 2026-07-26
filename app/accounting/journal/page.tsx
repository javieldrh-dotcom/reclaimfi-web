"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";
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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [lastEntryNumber, setLastEntryNumber] = useState(0);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [presentationMode, setPresentationMode] = useState(false);

  async function loadAvailableYears(cid: string) {
    const { data } = await supabase.from("journal_entries").select("entry_date").eq("company_id", cid).order("entry_date", { ascending: true });
    const years = Array.from(new Set((data ?? []).map((e: any) => e.entry_date.slice(0, 4)))).sort((a, b) => b.localeCompare(a));
    setAvailableYears(years);
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
    return years;
  }

  async function loadEntries(cid: string, year: string) {
    let query = supabase
      .from("journal_entries")
      .select("id, description, entry_date, status, entry_number")
      .eq("company_id", cid)
      .eq("status", "ACTIVE")
      .order("entry_number", { ascending: false });
    if (year !== "TODOS") {
      query = query.gte("entry_date", year + "-01-01").lte("entry_date", year + "-12-31");
    }
    const { data: entriesData } = await query;
    if (!entriesData || entriesData.length === 0) { setEntries([]); return; }
    const maxNum = Math.max(...entriesData.map((e: any) => e.entry_number || 0));
    setLastEntryNumber(maxNum);
    const entryIds = entriesData.map((e: any) => e.id);
    const { data: linesData } = await supabase
      .from("journal_lines")
      .select("id, journal_entry_id, account_id, debit, credit")
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
        const years = await loadAvailableYears(cid);
        const initialYear = years.length > 0 ? years[0] : new Date().getFullYear().toString();
        setSelectedYear(initialYear);
        await loadEntries(cid, initialYear);
      }
    }
    load();
  }, []);

  async function changeYear(year: string) {
    setSelectedYear(year);
    if (companyId) await loadEntries(companyId, year);
  }

  function updateLine(i: number, f: keyof Line, v: string) { const u = [...lines]; u[i][f] = v; setLines(u); }
  function addLine() { setLines([...lines, { account_id: "", debit: "", credit: "" }]); }
  function totalDebit() { return lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0); }
  function totalCredit() { return lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0); }
  function startEdit(entry: any) {
    setEditingEntryId(entry.id);
    setDescription(entry.description);
    setCurrency(currencyDoc);
    setExchangeRate("1");
    setLines((entry.journal_lines ?? []).map((l: any) => ({
      account_id: l.account_id,
      debit: l.debit > 0 ? String(l.debit) : "",
      credit: l.credit > 0 ? String(l.credit) : "",
    })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() {
    setEditingEntryId(null);
    setDescription("");
    setLines([{ account_id: "", debit: "", credit: "" }, { account_id: "", debit: "", credit: "" }]);
  }
  async function saveEntry() {
    setMessage("");
    if (!companyId) { setMessage("Sin empresa asociada."); return; }
    const d = totalDebit(); const c = totalCredit();
    if (d !== c || d === 0) { setMessage("El asiento no cuadra."); return; }
    const rate = parseFloat(exchangeRate) || 1;
    if (editingEntryId) {
      const { error: eUpd } = await supabase.from("journal_entries").update({ description }).eq("id", editingEntryId);
      if (eUpd) { setMessage("Error: " + eUpd.message); return; }
      await supabase.from("journal_lines").delete().eq("journal_entry_id", editingEntryId);
      const rows = lines.filter(l => l.account_id).map(l => ({ journal_entry_id: editingEntryId, account_id: l.account_id, debit: (parseFloat(l.debit) || 0) * rate, credit: (parseFloat(l.credit) || 0) * rate }));
      const { error: e2 } = await supabase.from("journal_lines").insert(rows);
      if (e2) { setMessage("Error: " + e2.message); return; }
      setMessage("Asiento editado correctamente.");
      cancelEdit();
      if (companyId) await loadEntries(companyId, selectedYear);
      return;
    }
    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;
    const { data: entry, error: e1 } = await supabase.from("journal_entries").insert([{ company_id: companyId, description, entry_date: new Date().toISOString().slice(0,10),currency, exchange_rate: rate, entry_number: nextNumber }]).select("id").single();
    if (e1 || !entry) { setMessage("Error: " + e1?.message); return; }
    const rows = lines.filter(l => l.account_id).map(l => ({ journal_entry_id: entry.id, account_id: l.account_id, debit: (parseFloat(l.debit) || 0) * rate, credit: (parseFloat(l.credit) || 0) * rate }));
    const { error: e2 } = await supabase.from("journal_lines").insert(rows);
    if (e2) { setMessage("Error: " + e2.message); return; }
    setMessage("Asiento Nº " + nextNumber + " guardado correctamente.");
    setDescription("");
    setLines([{ account_id: "", debit: "", credit: "" }, { account_id: "", debit: "", credit: "" }]);
    await loadAvailableYears(companyId);
    if (companyId) await loadEntries(companyId, selectedYear);
  }
  async function voidEntry(entryId: string) {
    const reason = window.prompt("Motivo de la anulacion:");
    if (!reason) return;
    await supabase.from("journal_entries").update({ status: "VOIDED", voided_at: new Date().toISOString(), void_reason: reason }).eq("id", entryId);
    if (companyId) await loadEntries(companyId, selectedYear);
  }
  function downloadPdf() {
    const activeEntries = entries.filter((e) => e.status === "ACTIVE");
    const sections = activeEntries.map((e: any) => {
      const entryItems = (e.journal_lines ?? []).map((l: any) => ({
        code: presentationMode ? undefined : (l.chart_of_accounts?.account_code ?? ""),
        name: l.chart_of_accounts?.account_name ?? "",
        amount: l.debit > 0 ? l.debit : l.credit,
        debitAmount: l.debit,
        creditAmount: l.credit,
      }));
      const entryDebit = entryItems.reduce((s: number, i: any) => s + (i.debitAmount || 0), 0);
      const entryCredit = entryItems.reduce((s: number, i: any) => s + (i.creditAmount || 0), 0);
      return {
        title: "Nº" + (e.entry_number ?? "S/N") + " - " + e.entry_date + " - " + e.description,
        items: entryItems,
        total: 0,
        totalLabel: "Subtotal",
        totalDebit: entryDebit,
        totalCredit: entryCredit,
      };
    });
    const totalD = activeEntries.flatMap((e: any) => e.journal_lines ?? []).reduce((s: number, l: any) => s + (l.debit || 0), 0);
    const totalC = activeEntries.flatMap((e: any) => e.journal_lines ?? []).reduce((s: number, l: any) => s + (l.credit || 0), 0);
    const doc = generateFinancialStatementPdf(
      "LIBRO DIARIO - EJERCICIO " + selectedYear,
      companyName,
      sections,
      "Total General",
      totalD,
      currencyDoc
    );
    doc.save("libro-diario-" + selectedYear + ".pdf");
  }
  const inputStyle = theme.inputStyle;
  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Libro Diario"
      subtitle={lastEntryNumber > 0 ? "Ultimo asiento del ejercicio " + selectedYear + ": Nº " + lastEntryNumber : undefined}
      fullWidth
      actions={entries.length > 0 ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#8B93A7", cursor: "pointer" }}>
            <input type="checkbox" checked={presentationMode} onChange={(e) => setPresentationMode(e.target.checked)} />
            Modo Presentacion (sin codigos)
          </label>
          <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
            Descargar PDF
          </button>
        </div>
      ) : undefined}
    >
      {accounts.length > 0 && (
        <div style={theme.cardStyle}>
          {editingEntryId && (
            <div style={{ marginBottom: 12, padding: 10, background: "#FB923C20", border: "1px solid #FB923C", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, color: "#FB923C", fontWeight: 700 }}>Editando asiento existente</span>
              <button onClick={cancelEdit} style={{ background: "none", border: "1px solid #FB923C", color: "#FB923C", padding: "4px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancelar Edicion</button>
            </div>
          )}
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
              <AccountSearchSelect accounts={accounts} value={line.account_id} onChange={(id) => updateLine(idx, "account_id", id)} placeholder="Buscar cuenta..." style={{ flex: 2, minWidth: 320 }} />
              <input type="number" value={line.debit} onChange={(e) => updateLine(idx, "debit", e.target.value)} style={inputStyle} placeholder="Debe" />
              <input type="number" value={line.credit} onChange={(e) => updateLine(idx, "credit", e.target.value)} style={inputStyle} placeholder="Haber" />
            </div>
          ))}
          <button onClick={addLine} style={{ marginTop: 12, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}>+ Linea</button>
          <p style={{ ...theme.numberStyle, marginTop: 12 }}>Debe: {totalDebit().toLocaleString()} | Haber: {totalCredit().toLocaleString()}</p>
          <button onClick={saveEntry} style={{ ...theme.buttonStyle, marginTop: 12 }}>{editingEntryId ? "GUARDAR EDICION" : "GUARDAR"}</button>
          {message && <p style={{ marginTop: 8, color: message.includes("Error") ? "#F87171" : theme.accent }}>{message}</p>}
        </div>
      )}
      <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {availableYears.map((y) => (
          <div key={y} onClick={() => changeYear(y)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15,
            background: selectedYear === y ? theme.accent : "transparent",
            color: selectedYear === y ? "#0B0E14" : "#8B93A7",
            border: selectedYear === y ? "none" : "1px solid #1F2937",
          }}>
            Ejercicio {y}
          </div>
        ))}
        <div onClick={() => changeYear("TODOS")} style={{
          padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15,
          background: selectedYear === "TODOS" ? theme.accent : "transparent",
          color: selectedYear === "TODOS" ? "#0B0E14" : "#8B93A7",
          border: selectedYear === "TODOS" ? "none" : "1px solid #1F2937",
        }}>
          Todos los Ejercicios
        </div>
      </div>
      {entries.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontFamily: theme.titleStyle.fontFamily, fontWeight: 700 }}>
            {selectedYear === "TODOS" ? "Todos los Ejercicios" : "Ejercicio Fiscal " + selectedYear}
          </h2>
          {entries.map((e) => (
            <div key={e.id} style={{ ...theme.cardStyle, marginTop: 12, opacity: e.status === "VOIDED" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 22 }}>
                  Nº{e.entry_number ?? "S/N"} - {e.entry_date} - {e.description}
                  {e.status === "VOIDED" && <span style={{ color: "#F87171", marginLeft: 8, fontSize: 16 }}>[ANULADO]</span>}
                </span>
                {e.status === "ACTIVE" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(e)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "4px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                      Editar
                    </button>
                    <button onClick={() => voidEntry(e.id)} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "4px 12px", borderRadius: 8,fontSize: 13, cursor: "pointer" }}>
                      Anular
                    </button>
                  </div>
                )}
              </div>
              {(e.journal_lines ?? []).map((l: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#B0B8C8", marginTop: 6, paddingLeft: 12 }}>
                  <span>{presentationMode ? l.chart_of_accounts?.account_name : l.chart_of_accounts?.account_code + " - " + l.chart_of_accounts?.account_name}</span>
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