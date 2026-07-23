"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function InventoryBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"balance" | "income" | "cashflow" | "equity">("balance");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("inventory_book_entries").select("*").eq("company_id", cid).order("entry_number", { ascending: false });
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
        const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        await loadEntries(cid);
      }
    }
    load();
  }, []);
  async function archivePeriod() {
    setMessage("");
    if (!companyId) return;
    setLoading(true);

    const { data: accountsData } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", companyId).in("account_type", ["ASSET", "LIABILITY", "REVENUE", "EXPENSE"]);
    const accountsMap: Record<string, any> = {};
    (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
    const accountIds = (accountsData ?? []).map((a: any) => a.id);

    const { data: lines } = await supabase.from("journal_lines").select("debit, credit, account_id").in("account_id", accountIds);

    const balances: Record<string, number> = {};
    let totalAssets = 0, totalLiabilities = 0, totalRevenue = 0, totalExpense = 0;
    (lines ?? []).forEach((l: any) => {
      const acc = accountsMap[l.account_id];
      if (!acc) return;
      const netMovement = (l.debit || 0) - (l.credit || 0);
      balances[l.account_id] = (balances[l.account_id] || 0) + netMovement;
      if (acc.account_type === "ASSET") totalAssets += netMovement;
      if (acc.account_type === "LIABILITY") totalLiabilities += -netMovement;
      if (acc.account_type === "REVENUE") totalRevenue += -netMovement;
      if (acc.account_type === "EXPENSE") totalExpense += netMovement;
    });
    const totalEquity = totalAssets - totalLiabilities;
    const netIncome = totalRevenue - totalExpense;

    const balanceSheetSnapshot = Object.entries(balances)
      .filter(([accId]) => ["ASSET", "LIABILITY"].includes(accountsMap[accId]?.account_type))
      .map(([accId, balance]) => ({
        code: accountsMap[accId].account_code, name: accountsMap[accId].account_name, type: accountsMap[accId].account_type,
        balance: accountsMap[accId].account_type === "LIABILITY" ? -balance : balance,
      }));

    const incomeStatementSnapshot = Object.entries(balances)
      .filter(([accId]) => ["REVENUE", "EXPENSE"].includes(accountsMap[accId]?.account_type))
      .map(([accId, balance]) => ({
        code: accountsMap[accId].account_code, name: accountsMap[accId].account_name, type: accountsMap[accId].account_type,
        balance: accountsMap[accId].account_type === "REVENUE" ? -balance : balance,
      }));

    const cashFlowSnapshot = {
      netIncome,
      operatingActivities: netIncome,
      note: "Flujo simplificado - referirse al modulo Flujo de Efectivo (NIC 7) para el detalle completo por actividades.",
    };

    const equityStatementSnapshot = {
      netIncomeForPeriod: netIncome,
      endingEquity: totalEquity,
      note: "Referirse al modulo Variacion de Patrimonio para el detalle de movimientos de capital.",
    };

    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { error } = await supabase.from("inventory_book_entries").insert([{
      company_id: companyId,
      entry_number: nextNumber,
      period_end: periodEnd,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      balance_sheet_snapshot: balanceSheetSnapshot,
      income_statement_snapshot: { items: incomeStatementSnapshot, netIncome },
      cash_flow_snapshot: cashFlowSnapshot,
      equity_statement_snapshot: equityStatementSnapshot,
    }]);

    if (error) { setMessage("Error: " + error.message); setLoading(false); return; }

    setMessage("Ejercicio archivado correctamente con los 4 Estados Financieros vinculados (Nº " + nextNumber + ").");
    setLoading(false);
    await loadEntries(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };
  const tabStyle = (tab: string) => ({
    padding: "8px 16px", cursor: "pointer", fontSize: 15, fontWeight: 700, borderRadius: 8,
    background: activeTab === tab ? theme.accent : "transparent",
    color: activeTab === tab ? "#0B0E14" : "#8B93A7",
    border: activeTab === tab ? "none" : "1px solid #1F2937",
  });

  const entriesByYear: Record<string, any[]> = {};
  entries.forEach((e) => {
    const year = e.period_end.slice(0, 4);
    if (!entriesByYear[year]) entriesByYear[year] = [];
    entriesByYear[year].push(e);
  });

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Inventario" subtitle="Registro legal obligatorio - Archiva el conjunto vinculado de Estados Financieros al cierre de cada ejercicio (Codigo de Comercio)" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 16, color: "#8B93A7", lineHeight: 1.7, ...theme.cardStyle }}>
          Este libro archiva de forma secuencial e inalterable el conjunto vinculado de Estados Financieros
          resultantes de las operaciones del ejercicio (Balance de Situacion, Estado de Resultados, Flujo de
          Efectivo, y Variacion de Patrimonio) al cierre de cada periodo. Una vez archivado, un registro no
          puede modificarse ni eliminarse.
        </p>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16, display: "block" }}>Fecha de Cierre del Ejercicio</label>
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <button onClick={archivePeriod} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          {loading ? "ARCHIVANDO..." : "ARCHIVAR ESTADOS FINANCIEROS DEL EJERCICIO"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {Object.keys(entriesByYear).sort((a, b) => b.localeCompare(a)).map((year) => (
        <div key={year} style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 28, color: theme.accent, fontWeight: 900 }}>{companyName} - Ejercicio Fiscal {year}</h2>
          {entriesByYear[year].map((e) => (
            <div key={e.id} style={{ ...theme.cardStyle, marginTop: 16 }}>
              <div onClick={() => setExpandedEntry(expandedEntry === e.id ? null : e.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>Nº {e.entry_number} - Cierre al {e.period_end}</span>
                <span style={{ fontSize: 16, color: theme.accent }}>{expandedEntry === e.id ? "▲ Ocultar" : "▼ Ver Estados Financieros"}</span>
              </div>

              {expandedEntry === e.id && (
                <div style={{ marginTop: 16, borderTop: "1px solid #1F2937", paddingTop: 16 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <div onClick={() => setActiveTab("balance")} style={tabStyle("balance")}>Balance de Situacion</div>
                    <div onClick={() => setActiveTab("income")} style={tabStyle("income")}>Estado de Resultados</div>
                    <div onClick={() => setActiveTab("cashflow")} style={tabStyle("cashflow")}>Flujo de Efectivo</div>
                    <div onClick={() => setActiveTab("equity")} style={tabStyle("equity")}>Variacion de Patrimonio</div>
                  </div>

                  {activeTab === "balance" && (
                    <div>
                      {(e.balance_sheet_snapshot ?? []).map((acc: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: 5, fontSize: 14, borderBottom: "1px solid #1F2937" }}>
                          <span>{acc.code} - {acc.name}</span>
                          <span style={theme.numberStyle}>{acc.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 8, marginTop: 8, borderTop: "1px solid " + theme.accent, fontWeight: 700 }}>
                        <span>Patrimonio Total</span>
                        <span style={theme.numberStyle}>{e.total_equity?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === "income" && (
                    <div>
                      {(e.income_statement_snapshot?.items ?? []).map((acc: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: 5, fontSize: 14, borderBottom: "1px solid #1F2937" }}>
                          <span>{acc.code} - {acc.name}</span>
                          <span style={theme.numberStyle}>{acc.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 8, marginTop: 8, borderTop: "1px solid " + theme.accent, fontWeight: 700 }}>
                        <span>Resultado Neto del Periodo</span>
                        <span style={theme.numberStyle}>{e.income_statement_snapshot?.netIncome?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === "cashflow" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}>
                        <span>Resultado Neto del Periodo</span>
                        <span style={theme.numberStyle}>{e.cash_flow_snapshot?.netIncome?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 8, fontStyle: "italic" }}>{e.cash_flow_snapshot?.note}</p>
                    </div>
                  )}

                  {activeTab === "equity" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}>
                        <span>Resultado Neto del Periodo</span>
                        <span style={theme.numberStyle}>{e.equity_statement_snapshot?.netIncomeForPeriod?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15 }}>
                        <span>Patrimonio al Cierre</span>
                        <span style={theme.numberStyle}>{e.equity_statement_snapshot?.endingEquity?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 8, fontStyle: "italic" }}>{e.equity_statement_snapshot?.note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </VerticalPageLayout>
  );
}
