"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";

interface CompanyOption {
  id: string;
  name: string;
  functional_currency: string;
}

interface PerCompanyBalance {
  companyId: string;
  companyName: string;
  currency: string;
  rate: number;
  totalDebitOriginal: number;
  totalCreditOriginal: number;
  isBalanced: boolean;
  accounts: Record<string, { name: string; debit: number; credit: number }>;
}

interface ConsolidatedRow {
  name: string;
  debit: number;
  credit: number;
  perCompany: Record<string, { debit: number; credit: number }>;
}

// Consolidacion multi-entidad / multi-moneda -- version honesta, sin
// eliminaciones automaticas.
//
// Que SI hace esta pantalla:
// - Suma, cuenta por cuenta (agrupando por NOMBRE de cuenta, no por codigo,
//   porque dos empresas pueden tener el mismo codigo apuntando a cosas
//   distintas, o nombres iguales con codigos distintos, segun como se haya
//   creado cada plan de cuentas), los balances de comprobacion de 2+
//   empresas que el usuario elija, luego de convertir cada empresa a una
//   moneda de presentacion comun usando una tasa de cambio que el contador
//   ingresa a mano (mismo patron ya usado en Nomina -- no existe en el
//   sistema una tabla de tasas historicas/automaticas).
//
// Que NO hace (deliberadamente, para no inventar logica contable que no
// se puede verificar sin el criterio del contador):
// - NO elimina saldos/transacciones intercompania (cuentas por cobrar/pagar
//   entre las mismas empresas consolidadas, ventas intercompania, etc).
// - NO elimina la inversion en subsidiarias contra el patrimonio de la
//   subsidiaria, ni calcula utilidades no realizadas en inventario
//   intercompania.
// - NO calcula interes minoritario / participacion no controladora (NIC 27 /
//   NIIF 10).
// - NO aplica el metodo de conversion de NIC 21 completo (activos/pasivos a
//   tasa de cierre, patrimonio a tasa historica, resultados a tasa promedio,
//   diferencia en "ajuste por conversion" dentro del patrimonio). Aqui se
//   usa UNA sola tasa manual por empresa para TODAS sus cuentas -- una
//   simplificacion deliberada, declarada en pantalla.
// Esta pantalla es un punto de partida: un balance de comprobacion
// combinado y convertido, trazable linea por linea hacia cada empresa
// de origen, para que el contador aplique su propio criterio (y, si
// corresponde, sus propios asientos de eliminacion manuales) por encima.
export default function ConsolidationPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [presentationCurrency, setPresentationCurrency] = useState("USD");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [computing, setComputing] = useState(false);
  const [perCompany, setPerCompany] = useState<PerCompanyBalance[]>([]);
  const [consolidatedRows, setConsolidatedRows] = useState<ConsolidatedRow[]>([]);
  const [message, setMessage] = useState("");
  const theme = getVerticalTheme("accounting");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoadingCompanies(false); return; }
      const { data } = await supabase
        .from("user_companies")
        .select("company_id, companies(id, name, functional_currency)")
        .eq("user_id", userData.user.id);
      const list: CompanyOption[] = (data ?? [])
        .map((r: any) => r.companies)
        .filter(Boolean)
        .map((c: any) => ({ id: c.id, name: c.name, functional_currency: c.functional_currency ?? "USD" }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(list);
      setLoadingCompanies(false);
    }
    load();
  }, []);

  function toggleCompany(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return next;
    });
    setRates((prev) => {
      if (prev[id] !== undefined) return prev;
      const c = companies.find((x) => x.id === id);
      const defaultRate = c && c.functional_currency === presentationCurrency ? "1" : "";
      return { ...prev, [id]: defaultRate };
    });
  }

  async function computeConsolidation() {
    setMessage("");
    if (selectedIds.length < 2) {
      setMessage("Selecciona al menos 2 empresas para consolidar.");
      return;
    }
    const missingRate = selectedIds.find((id) => !rates[id] || parseFloat(rates[id]) <= 0);
    if (missingRate) {
      setMessage("Falta la tasa de cambio (hacia " + presentationCurrency + ") de: " + companies.find((c) => c.id === missingRate)?.name);
      return;
    }
    setComputing(true);
    const results: PerCompanyBalance[] = [];
    for (const companyId of selectedIds) {
      const company = companies.find((c) => c.id === companyId)!;
      const rate = parseFloat(rates[companyId]) || 1;
      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("id, account_name")
        .eq("company_id", companyId)
        .not("account_type", "in", "(ORDER_DEBTOR,ORDER_CREDITOR)");
      const accountsMap: Record<string, string> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a.account_name; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);
      const { data: lines } = accountIds.length > 0
        ? await supabase
            .from("journal_lines")
            .select("debit, credit, account_id, journal_entries!inner(status)")
            .in("account_id", accountIds)
            .eq("journal_entries.status", "ACTIVE")
        : { data: [] as any[] };
      const accounts: Record<string, { name: string; debit: number; credit: number }> = {};
      (lines ?? []).forEach((l: any) => {
        const name = accountsMap[l.account_id];
        if (!name) return;
        const key = name.trim().toUpperCase();
        if (!accounts[key]) accounts[key] = { name, debit: 0, credit: 0 };
        accounts[key].debit += l.debit || 0;
        accounts[key].credit += l.credit || 0;
      });
      const totalDebitOriginal = Object.values(accounts).reduce((s, a) => s + a.debit, 0);
      const totalCreditOriginal = Object.values(accounts).reduce((s, a) => s + a.credit, 0);
      results.push({
        companyId,
        companyName: company.name,
        currency: company.functional_currency,
        rate,
        totalDebitOriginal,
        totalCreditOriginal,
        isBalanced: Math.abs(totalDebitOriginal - totalCreditOriginal) < 0.01,
        accounts,
      });
    }
    setPerCompany(results);

    const consolidated: Record<string, ConsolidatedRow> = {};
    results.forEach((r) => {
      Object.entries(r.accounts).forEach(([key, a]) => {
        if (!consolidated[key]) consolidated[key] = { name: a.name, debit: 0, credit: 0, perCompany: {} };
        const convDebit = a.debit * r.rate;
        const convCredit = a.credit * r.rate;
        consolidated[key].debit += convDebit;
        consolidated[key].credit += convCredit;
        consolidated[key].perCompany[r.companyId] = { debit: convDebit, credit: convCredit };
      });
    });
    setConsolidatedRows(Object.values(consolidated).sort((a, b) => a.name.localeCompare(b.name)));
    setComputing(false);
  }

  const totalDebit = consolidatedRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = consolidatedRows.reduce((s, r) => s + r.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  function downloadPdf() {
    const companyNames = perCompany.map((p) => p.companyName).join(" + ");
    const doc = generateFinancialStatementPdf(
      "BALANCE CONSOLIDADO (SIN ELIMINACIONES)",
      companyNames,
      [{
        title: "Cuentas (combinadas, convertidas a " + presentationCurrency + ")",
        items: consolidatedRows.map((r) => ({ code: "", name: r.name, amount: 0, debitAmount: r.debit, creditAmount: r.credit })),
        total: 0,
        totalLabel: "Totales",
        totalDebit,
        totalCredit,
      }],
      "Total Debe / Haber",
      totalDebit,
      presentationCurrency
    );
    doc.save("balance-consolidado.pdf");
  }

  if (loadingCompanies) return <div style={theme.pageStyle}>Cargando...</div>;

  return (
    <div style={theme.pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1500, margin: "0 auto" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 32, background: theme.accent, borderRadius: 2 }} />
            <h1 style={theme.titleStyle}>Consolidacion Multi-Entidad</h1>
          </div>
          <p style={{ color: "#8B93A7", fontSize: 14, marginLeft: 16, marginTop: 4 }}>
            Combina y convierte los balances de comprobacion de varias empresas. No automatiza eliminaciones intercompania ni interes minoritario.
          </p>
        </div>
        {consolidatedRows.length > 0 && (
          <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
            Descargar PDF
          </button>
        )}
      </div>

      <div style={{
        marginTop: 20, maxWidth: 1500, margin: "20px auto 0",
        padding: "14px 20px", borderRadius: 10,
        background: "#F59E0B15", border: "1px solid #F59E0B40", color: "#F59E0B", fontSize: 13.5, lineHeight: 1.6,
      }}>
        Esta pantalla NO elimina saldos ni transacciones intercompania (cuentas por cobrar/pagar entre las empresas seleccionadas, ventas cruzadas, utilidad no realizada), NO elimina la inversion en subsidiarias, y NO calcula interes minoritario (NIIF 10). Usa una sola tasa de cambio manual por empresa para todas sus cuentas (no el metodo completo de NIC 21). Es un balance combinado y convertido, trazable por empresa, para que aplique su criterio y, si corresponde, sus asientos de eliminacion manuales.
      </div>

      <div style={{ ...theme.cardStyle, marginTop: 20, maxWidth: 1500, margin: "20px auto 0", padding: 24 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Empresas a consolidar</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
              {companies.length === 0 && <div style={{ color: "#8B93A7", fontSize: 14 }}>No tienes empresas asociadas.</div>}
              {companies.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, padding: "6px 8px", borderRadius: 6, background: selectedIds.includes(c.id) ? theme.subtleAccent + "15" : "transparent" }}>
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleCompany(c.id)} />
                  <span>{c.name}</span>
                  <span style={{ color: "#8B93A7", fontSize: 12 }}>({c.functional_currency})</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ flex: "1 1 280px" }}>
            <div style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Moneda de presentacion</div>
            <select value={presentationCurrency} onChange={(e) => setPresentationCurrency(e.target.value)} style={{ ...theme.inputStyle, width: "100%", marginBottom: 16 }}>
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>

            {selectedIds.length > 0 && (
              <>
                <div style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                  Tasa de cambio hacia {presentationCurrency}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedIds.map((id) => {
                    const c = companies.find((x) => x.id === id);
                    if (!c) return null;
                    return (
                      <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "#8B93A7", flex: 1 }}>{c.name} ({c.functional_currency})</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={rates[id] ?? ""}
                          onChange={(e) => setRates((prev) => ({ ...prev, [id]: e.target.value }))}
                          style={{ ...theme.inputStyle, width: 120 }}
                          placeholder={c.functional_currency === presentationCurrency ? "1" : "Tasa"}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <button onClick={computeConsolidation} disabled={computing || selectedIds.length < 2} style={{ ...theme.buttonStyle, marginTop: 20, opacity: computing || selectedIds.length < 2 ? 0.6 : 1 }}>
          {computing ? "Calculando..." : "Consolidar"}
        </button>
        {message && <div style={{ marginTop: 12, color: "#F87171", fontSize: 14 }}>{message}</div>}
      </div>

      {perCompany.length > 0 && (
        <div style={{ ...theme.cardStyle, marginTop: 20, maxWidth: 1500, margin: "20px auto 0", padding: 24 }}>
          <div style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Verificacion por empresa (antes de consolidar)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {perCompany.map((p) => (
              <div key={p.companyId} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderBottom: "1px solid #1F2937" }}>
                <span>{p.companyName} ({p.currency}, tasa {p.rate})</span>
                <span style={{ color: p.isBalanced ? theme.subtleAccent : "#F87171" }}>
                  Debe {p.totalDebitOriginal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / Haber {p.totalCreditOriginal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -- {p.isBalanced ? "Cuadrado" : "Descuadrado (revisar antes de consolidar)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {consolidatedRows.length > 0 && (
        <>
          <div style={{ ...theme.cardStyle, marginTop: 20, padding: 0, overflow: "hidden", maxWidth: 1500, margin: "20px auto 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: theme.accent, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", background: "#1F293755" }}>
                  <th style={{ padding: "16px 20px" }}>Cuenta</th>
                  <th style={{ padding: "16px 20px", textAlign: "right", width: 160 }}>Debe ({presentationCurrency})</th>
                  <th style={{ padding: "16px 20px", textAlign: "right", width: 160 }}>Haber ({presentationCurrency})</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedRows.map((r, idx) => (
                  <tr key={r.name} style={{ borderBottom: idx < consolidatedRows.length - 1 ? "1px solid #1F2937" : "none" }}>
                    <td style={{ padding: "16px 20px", fontSize: 18 }}>{r.name}</td>
                    <td style={{ padding: "16px 20px", textAlign: "right", ...theme.numberStyle, fontSize: 18 }}>{r.debit > 0 ? r.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</td>
                    <td style={{ padding: "16px 20px", textAlign: "right", ...theme.numberStyle, fontSize: 18 }}>{r.credit > 0 ? r.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: 20,
            padding: "18px 24px",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: 1500,
            margin: "20px auto 0",
            background: isBalanced ? theme.subtleAccent + "15" : "#F8717115",
            border: "1px solid " + (isBalanced ? theme.subtleAccent + "40" : "#F8717140"),
          }}>
            <div style={{ ...theme.kpiStyle, color: isBalanced ? theme.subtleAccent : "#F87171" }}>
              Debe: {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - Haber: {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontWeight: 700, color: isBalanced ? theme.subtleAccent : "#F87171", display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
              <span>{isBalanced ? "OK" : "!"}</span>
              {isBalanced ? "Cuadrado" : "Descuadrado"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
