"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function HyperinflationPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [baseDate, setBaseDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
      }
    }
    load();
  }, []);

  function monthKey(dateStr: string) {
    return dateStr.slice(0, 7);
  }

  async function calculateRestatement() {
    if (!companyId) return;
    setLoading(true);
    setMessage("");
    setResult(null);

    const { data: allIndices } = await supabase.from("price_indices").select("index_value, period_date").eq("country_code", "VE").eq("index_name", "INPC_BCV").order("period_date", { ascending: true });
    if (!allIndices || allIndices.length === 0) {
      setMessage("No hay Indices de Precios cargados.");
      setLoading(false);
      return;
    }
    const indexByMonth: Record<string, number> = {};
    allIndices.forEach((r: any) => { indexByMonth[monthKey(r.period_date)] = r.index_value; });
    const sortedMonths = Object.keys(indexByMonth).sort();

    function indexInfoForDate(dateStr: string): { value: number; month: string; exact: boolean } | null {
      const mk = monthKey(dateStr);
      if (indexByMonth[mk] !== undefined) return { value: indexByMonth[mk], month: mk, exact: true };
      let best: string | null = null;
      for (const m of sortedMonths) { if (m <= mk) best = m; else break; }
      return best ? { value: indexByMonth[best], month: best, exact: false } : null;
    }
    function indexForDate(dateStr: string): number | null {
      const info = indexInfoForDate(dateStr);
      return info ? info.value : null;
    }

    const reportIndexInfo = indexInfoForDate(reportDate);
    if (!reportIndexInfo) { setMessage("No se encontro Indice de Precios para la fecha de reexpresion."); setLoading(false); return; }
    const reportIndex = reportIndexInfo.value;

    const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type, monetary_type").eq("company_id", companyId).not("account_type", "in", "(ORDER_DEBTOR,ORDER_CREDITOR)");
    const accountsMap: Record<string, any> = {};
    (accounts ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
    const accountIds = (accounts ?? []).map((a: any) => a.id);

    const { data: allLines } = await supabase.from("journal_lines").select("debit, credit, account_id, journal_entries!inner(status, entry_date)").in("account_id", accountIds).eq("journal_entries.status", "ACTIVE").lte("journal_entries.entry_date", reportDate);

    let missingIndexCount = 0;
    const balanceAccum: Record<string, { historical: number; restated: number }> = {};
    const incomeAccum: Record<string, { historical: number; restated: number }> = {};

    (allLines ?? []).forEach((l: any) => {
      const acc = accountsMap[l.account_id];
      if (!acc) return;
      const entryDate = l.journal_entries.entry_date;
      let signedAmount = (l.debit || 0) - (l.credit || 0);
      if (acc.account_type === "LIABILITY" || acc.account_type === "EQUITY" || acc.account_type === "REVENUE") signedAmount = -signedAmount;

      const isBalanceSheetAccount = acc.account_type === "ASSET" || acc.account_type === "LIABILITY" || acc.account_type === "EQUITY";
      const isIncomeAccount = acc.account_type === "REVENUE" || acc.account_type === "EXPENSE";
      const isMonetary = acc.monetary_type === "MONETARY";

      let restatedAmount = signedAmount;
      if (!isMonetary) {
        const lineIndex = indexForDate(entryDate);
        if (lineIndex) {
          restatedAmount = signedAmount * (reportIndex / lineIndex);
        } else {
          missingIndexCount++;
        }
      }

      if (isBalanceSheetAccount) {
        if (!balanceAccum[l.account_id]) balanceAccum[l.account_id] = { historical: 0, restated: 0 };
        balanceAccum[l.account_id].historical += signedAmount;
        balanceAccum[l.account_id].restated += restatedAmount;
      }
      if (isIncomeAccount && entryDate >= baseDate && entryDate <= reportDate) {
        if (!incomeAccum[l.account_id]) incomeAccum[l.account_id] = { historical: 0, restated: 0 };
        incomeAccum[l.account_id].historical += signedAmount;
        incomeAccum[l.account_id].restated += restatedAmount;
      }
    });

    let totalAssetsHist = 0, totalAssetsRest = 0, totalLiabHist = 0, totalLiabRest = 0, totalEquityHist = 0, totalEquityRest = 0;
    const balanceDetail = Object.entries(balanceAccum).map(([accId, v]) => {
      const acc = accountsMap[accId];
      if (acc.account_type === "ASSET") { totalAssetsHist += v.historical; totalAssetsRest += v.restated; }
      if (acc.account_type === "LIABILITY") { totalLiabHist += v.historical; totalLiabRest += v.restated; }
      if (acc.account_type === "EQUITY") { totalEquityHist += v.historical; totalEquityRest += v.restated; }
      return { code: acc.account_code, name: acc.account_name, type: acc.account_type, monetary: acc.monetary_type ?? "SIN CLASIFICAR", historical: v.historical, restated: v.restated };
    }).filter((d) => Math.abs(d.historical) > 0.01);

    let totalRevenueHist = 0, totalRevenueRest = 0, totalExpenseHist = 0, totalExpenseRest = 0;
    const incomeDetail = Object.entries(incomeAccum).map(([accId, v]) => {
      const acc = accountsMap[accId];
      if (acc.account_type === "REVENUE") { totalRevenueHist += v.historical; totalRevenueRest += v.restated; }
      if (acc.account_type === "EXPENSE") { totalExpenseHist += v.historical; totalExpenseRest += v.restated; }
      return { code: acc.account_code, name: acc.account_name, type: acc.account_type, historical: v.historical, restated: v.restated };
    }).filter((d) => Math.abs(d.historical) > 0.01);

    const netIncomeHist = totalRevenueHist - totalExpenseHist;
    const netIncomeRestOperating = totalRevenueRest - totalExpenseRest;
    const plugResult = totalAssetsRest - totalLiabRest - totalEquityRest;
    const monetaryGainLoss = plugResult - netIncomeRestOperating;

    setResult({
      reportIndex, reportIndexInfo, balanceDetail, incomeDetail,
      totalAssetsHist, totalAssetsRest, totalLiabHist, totalLiabRest, totalEquityHist, totalEquityRest,
      totalRevenueHist, totalRevenueRest, totalExpenseHist, totalExpenseRest,
      netIncomeHist, netIncomeRestOperating, plugResult, monetaryGainLoss, missingIndexCount,
    });
    setLoading(false);
  }

  const inputStyle = theme.inputStyle;

  return (
    <VerticalPageLayout vertical="accounting" title="Reexpresion por Inflacion (NIC 29)" subtitle="Reexpresion mes por mes segun el INPC, aplicada a Balance de Situacion y Estado de Resultados" fullWidth>
      <div style={{ maxWidth: 950 }}>
        <p style={{ fontSize: 15, color: "#8B93A7" }}>{companyName}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 13, color: theme.accent }}>Inicio del Ejercicio (Estado de Resultados)</label>
            <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: theme.accent }}>Fecha de Reexpresion</label>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
          </div>
        </div>
        <button onClick={calculateRestatement} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          {loading ? "CALCULANDO..." : "CALCULAR REEXPRESION MES A MES"}
        </button>
        {message && <p style={{ marginTop: 10, color: "#f87171" }}>{message}</p>}

        {result && (
          <>
            {!result.reportIndexInfo.exact && (
              <p style={{ marginTop: 12, fontSize: 13, color: "#FB923C" }}>⚠ No hay Indice de Precios publicado para el mes de la fecha de reexpresion. Se uso el ultimo indice disponible ({result.reportIndexInfo.month}) como aproximacion. Los resultados se ajustaran automaticamente cuando cargues el indice real de ese mes en Indices de Precios.</p>
            )}
            {result.missingIndexCount > 0 && (
              <p style={{ marginTop: 12, fontSize: 13, color: "#FB923C" }}>⚠ {result.missingIndexCount} transaccion(es) no encontraron indice para su mes y no se reexpresaron.</p>
            )}

            <div style={{ ...theme.cardStyle, marginTop: 16 }}>
              <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>BALANCE DE SITUACION REEXPRESADO</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Activos</span><span style={theme.numberStyle}>{result.totalAssetsHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalAssetsRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Pasivos</span><span style={theme.numberStyle}>{result.totalLiabHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalLiabRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Patrimonio (sin resultado)</span><span style={theme.numberStyle}>{result.totalEquityHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalEquityRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div style={{ ...theme.cardStyle, marginTop: 16 }}>
              <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>ESTADO DE RESULTADOS REEXPRESADO</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Ingresos</span><span style={theme.numberStyle}>{result.totalRevenueHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalRevenueRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Gastos</span><span style={theme.numberStyle}>{result.totalExpenseHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalExpenseRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 4, borderTop: "1px solid #1F2937" }}><span style={{ fontWeight: 700 }}>Resultado Operativo Reexpresado</span><span style={{ ...theme.numberStyle, fontWeight: 700 }}>{result.netIncomeRestOperating.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div style={{ ...theme.cardStyle, marginTop: 16, border: "1px solid " + theme.accent }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontWeight: 700 }}>Ganancia/(Perdida) por Posicion Monetaria Neta</span>
                <span style={{ ...theme.numberStyle, fontWeight: 900, color: result.monetaryGainLoss >= 0 ? "#4ade80" : "#f87171" }}>{result.monetaryGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #1F2937" }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Resultado Neto Reexpresado (Total)</span>
                <span style={{ ...theme.numberStyle, fontWeight: 900, fontSize: 18, color: theme.accent }}>{result.plugResult.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Detalle Balance de Situacion</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: theme.accent }}>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Cuenta</th>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center" }}>Clasificacion</th>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right" }}>Historico</th>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right" }}>Reexpresado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.balanceDetail.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #1F2937", padding: 6 }}>{d.code} - {d.name}</td>
                        <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center", color: d.monetary === "SIN CLASIFICAR" ? "#FB923C" : "#8B93A7" }}>{d.monetary}</td>
                        <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right", ...theme.numberStyle }}>{d.historical.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right", ...theme.numberStyle }}>{d.restated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Detalle Estado de Resultados</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: theme.accent }}>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Cuenta</th>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right" }}>Historico</th>
                      <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right" }}>Reexpresado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.incomeDetail.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #1F2937", padding: 6 }}>{d.code} - {d.name}</td>
                        <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right", ...theme.numberStyle }}>{d.historical.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "right", ...theme.numberStyle }}>{d.restated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </VerticalPageLayout>
  );
}