"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function HyperinflationPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
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
        const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        setCurrency(companyData?.functional_currency ?? "USD");
      }
    }
    load();
  }, []);

  async function calculateRestatement() {
    if (!companyId) return;
    setLoading(true);
    setMessage("");
    setResult(null);

    const { data: baseIdx } = await supabase.from("price_indices").select("index_value, period_date").eq("country_code", "VE").eq("index_name", "INPC_BCV").lte("period_date", baseDate).order("period_date", { ascending: false }).limit(1).maybeSingle();
    const { data: reportIdx } = await supabase.from("price_indices").select("index_value, period_date").eq("country_code", "VE").eq("index_name", "INPC_BCV").lte("period_date", reportDate).order("period_date", { ascending: false }).limit(1).maybeSingle();

    if (!baseIdx || !reportIdx) {
      setMessage("No se encontro Indice de Precios (INPC) para una de las 2 fechas. Verifica en Indices de Precios.");
      setLoading(false);
      return;
    }

    const factor = reportIdx.index_value / baseIdx.index_value;

    const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type, monetary_type").eq("company_id", companyId).not("account_type", "in", "(ORDER_DEBTOR,ORDER_CREDITOR)");
    const accountIds = (accounts ?? []).map((a: any) => a.id);

    const { data: lines } = await supabase.from("journal_lines").select("debit, credit, account_id, journal_entries!inner(status, entry_date)").in("account_id", accountIds).eq("journal_entries.status", "ACTIVE").lte("journal_entries.entry_date", reportDate);

    const balances: Record<string, number> = {};
    (lines ?? []).forEach((l: any) => {
      balances[l.account_id] = (balances[l.account_id] || 0) + (l.debit || 0) - (l.credit || 0);
    });

    let totalAssetsHist = 0, totalAssetsRest = 0;
    let totalLiabHist = 0, totalLiabRest = 0;
    let totalEquityHist = 0, totalEquityRest = 0;
    let totalRevenueHist = 0, totalExpenseHist = 0;
    let missingClassification = 0;

    const detail = (accounts ?? []).map((a: any) => {
      let bal = balances[a.id] || 0;
      if (a.account_type === "LIABILITY" || a.account_type === "EQUITY" || a.account_type === "REVENUE") bal = -bal;
      if (Math.abs(bal) < 0.01) return null;

      if (!a.monetary_type) missingClassification++;
      const isMonetary = a.monetary_type === "MONETARY";
      const restated = isMonetary ? bal : bal * factor;

      if (a.account_type === "ASSET") { totalAssetsHist += bal; totalAssetsRest += restated; }
      if (a.account_type === "LIABILITY") { totalLiabHist += bal; totalLiabRest += restated; }
      if (a.account_type === "EQUITY") { totalEquityHist += bal; totalEquityRest += restated; }
      if (a.account_type === "REVENUE") totalRevenueHist += bal;
      if (a.account_type === "EXPENSE") totalExpenseHist += bal;

      return { code: a.account_code, name: a.account_name, type: a.account_type, monetary: a.monetary_type ?? "SIN CLASIFICAR", historical: bal, restated };
    }).filter(Boolean);

    const netIncomeHist = totalRevenueHist - totalExpenseHist;
    const equityHistWithResult = totalEquityHist + netIncomeHist;
    const plugResult = totalAssetsRest - totalLiabRest - totalEquityRest;
    const monetaryGainLoss = plugResult - (netIncomeHist * factor);

    setResult({
      factor, baseIndex: baseIdx.index_value, reportIndex: reportIdx.index_value,
      basePeriod: baseIdx.period_date, reportPeriod: reportIdx.period_date,
      detail, totalAssetsHist, totalAssetsRest, totalLiabHist, totalLiabRest,
      totalEquityHist, totalEquityRest, netIncomeHist, plugResult, monetaryGainLoss,
      missingClassification,
    });
    setLoading(false);
  }

  const inputStyle = theme.inputStyle;

  return (
    <VerticalPageLayout vertical="accounting" title="Reexpresion por Inflacion (NIC 29)" subtitle="Balance de Situacion ajustado por el Indice Nacional de Precios al Consumidor" fullWidth>
      <div style={{ maxWidth: 900 }}>
        <p style={{ fontSize: 15, color: "#8B93A7" }}>{companyName}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 13, color: theme.accent }}>Fecha Base</label>
            <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: theme.accent }}>Fecha de Reexpresion</label>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
          </div>
        </div>
        <button onClick={calculateRestatement} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          {loading ? "CALCULANDO..." : "CALCULAR REEXPRESION"}
        </button>
        {message && <p style={{ marginTop: 10, color: "#f87171" }}>{message}</p>}

        {result && (
          <>
            <div style={{ ...theme.cardStyle, marginTop: 24 }}>
              <p style={{ fontSize: 16 }}>Factor de Reexpresion: <b style={{ color: theme.accent }}>{result.factor.toFixed(6)}</b></p>
              <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>Indice Base ({result.basePeriod}): {result.baseIndex.toLocaleString()} — Indice Reexpresion ({result.reportPeriod}): {result.reportIndex.toLocaleString()}</p>
              {result.missingClassification > 0 && (
                <p style={{ fontSize: 13, color: "#FB923C", marginTop: 8 }}>⚠ {result.missingClassification} cuenta(s) sin clasificar como Monetaria/No Monetaria — se trataron como No Monetarias por defecto. Clasifica en el Plan de Cuentas para mayor precision.</p>
              )}
            </div>

            <div style={{ ...theme.cardStyle, marginTop: 16 }}>
              <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>RESUMEN DEL BALANCE REEXPRESADO</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Activos (Historico → Reexpresado)</span><span style={theme.numberStyle}>{result.totalAssetsHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalAssetsRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Pasivos (Historico → Reexpresado)</span><span style={theme.numberStyle}>{result.totalLiabHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalLiabRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}><span>Total Patrimonio, sin resultado (Historico → Reexpresado)</span><span style={theme.numberStyle}>{result.totalEquityHist.toLocaleString(undefined, { minimumFractionDigits: 2 })} → {result.totalEquityRest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 8, borderTop: "2px solid " + theme.accent }}>
                <span style={{ fontWeight: 700 }}>Ganancia/(Perdida) por Posicion Monetaria Neta</span>
                <span style={{ ...theme.numberStyle, fontWeight: 900, color: result.monetaryGainLoss >= 0 ? "#4ade80" : "#f87171" }}>{result.monetaryGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <span style={{ fontWeight: 700 }}>Resultado del Ejercicio Reexpresado (Total)</span>
                <span style={{ ...theme.numberStyle, fontWeight: 900, color: theme.accent }}>{result.plugResult.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Detalle por Cuenta</h3>
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
                    {result.detail.map((d: any, idx: number) => (
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
          </>
        )}
      </div>
    </VerticalPageLayout>
  );
}