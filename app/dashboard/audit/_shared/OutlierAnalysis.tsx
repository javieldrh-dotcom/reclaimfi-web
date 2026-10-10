"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

// Deteccion de anomalias por cuenta (sigma-clipping): la misma tecnica
// que usa Aletheia Ledger para descartar destellos y ruido instrumental
// en curvas de luz fotometricas, aplicada aqui a contabilidad. Por cada
// cuenta del plan de cuentas se calcula la media y desviacion estandar
// de sus montos, se recalculan de forma iterativa excluyendo los puntos
// que se alejan mas de N desviaciones (para que un outlier extremo no
// "infle" el promedio y se esconda a si mismo), y al final se marca
// cualquier transaccion que siga fuera de ese rango.
//
// Es el complemento natural de la Ley de Benford (ver BenfordAnalysis.tsx):
// Benford mira el patron del primer digito en TODO el conjunto de
// montos; esto mira, cuenta por cuenta, si una transaccion individual
// se sale del comportamiento normal de esa cuenta especifica. Es la
// misma pareja de pruebas que describe Nigrini en su libro de
// referencia de auditoria forense (el "Z-statistic test" junto al test
// de Benford) y que implementan las suites comerciales de analitica
// forense (CaseWare IDEA, ACL/Diligent).
//
// Fuente de datos: igual que BenfordAnalysis - journal_lines de la
// empresa de reconstruccion contable vinculada al caso
// (companies.reconstruction_case_id).

interface Props {
  caseId: string;
}

interface FlaggedTransaction {
  accountName: string;
  amount: number;
  zScore: number;
  description: string;
  entryDate: string;
  accountMean: number;
  accountStd: number;
}

interface OutlierResult {
  accountsAnalyzed: number;
  accountsSkipped: number; // muy pocas transacciones para un sigma-clip confiable
  flagged: FlaggedTransaction[];
}

const MIN_SAMPLES_PER_ACCOUNT = 5;
const SIGMA_THRESHOLD = 3;
const MAX_CLIP_ITERATIONS = 5;

// Sigma-clipping iterativo: en cada vuelta calcula media/desviacion del
// subconjunto actual, descarta lo que quede a mas de SIGMA_THRESHOLD
// desviaciones, y repite con el subconjunto depurado. Asi un valor muy
// extremo no distorsiona la desviacion estandar lo suficiente como para
// camuflarse a si mismo (el problema clasico de un solo paso de Z-score).
function sigmaClip(values: number[]): { keptIndices: Set<number>; mean: number; std: number } {
  let indices = values.map((_, i) => i);

  for (let iter = 0; iter < MAX_CLIP_ITERATIONS; iter++) {
    if (indices.length < 2) break;

    const subset = indices.map((i) => values[i]);
    const mean = subset.reduce((a, b) => a + b, 0) / subset.length;
    const variance = subset.reduce((a, b) => a + (b - mean) ** 2, 0) / subset.length;
    const std = Math.sqrt(variance);

    if (std === 0) break; // todos los montos identicos - nada que marcar

    const nextIndices = indices.filter((i) => Math.abs(values[i] - mean) <= SIGMA_THRESHOLD * std);

    if (nextIndices.length === indices.length) {
      return { keptIndices: new Set(indices), mean, std };
    }
    indices = nextIndices;
  }

  const subset = indices.map((i) => values[i]);
  const mean = subset.length ? subset.reduce((a, b) => a + b, 0) / subset.length : 0;
  const variance = subset.length ? subset.reduce((a, b) => a + (b - mean) ** 2, 0) / subset.length : 0;
  return { keptIndices: new Set(indices), mean, std: Math.sqrt(variance) };
}

export default function OutlierAnalysis({ caseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OutlierResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setResult(null);

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("reconstruction_case_id", caseId)
      .maybeSingle();

    if (!company) {
      setError("Este caso no tiene una reconstruccion contable generada todavia. Primero corre 'Reconstruccion Contable desde Evidencia'.");
      setLoading(false);
      return;
    }

    const { data: entries } = await supabase
      .from("journal_entries")
      .select("id, description, entry_date")
      .eq("company_id", company.id);

    const entryIds = (entries ?? []).map((e: any) => e.id);
    if (entryIds.length === 0) {
      setError("La reconstruccion de este caso no tiene asientos contables todavia.");
      setLoading(false);
      return;
    }
    const entryById = new Map((entries ?? []).map((e: any) => [e.id, e]));

    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, account_name")
      .eq("company_id", company.id);
    const accountNameById = new Map((accounts ?? []).map((a: any) => [a.id, a.account_name]));

    const { data: lines } = await supabase
      .from("journal_lines")
      .select("journal_entry_id, account_id, debit, credit")
      .in("journal_entry_id", entryIds);

    // Agrupar por cuenta: cada linea aporta un solo monto (el que no sea
    // cero entre debito y credito), junto con el asiento del que viene.
    const byAccount = new Map<string, { amount: number; entryId: string }[]>();
    for (const line of lines ?? []) {
      const amount = line.debit > 0 ? line.debit : line.credit;
      if (!amount || amount <= 0) continue;
      const list = byAccount.get(line.account_id) ?? [];
      list.push({ amount, entryId: line.journal_entry_id });
      byAccount.set(line.account_id, list);
    }

    let accountsAnalyzed = 0;
    let accountsSkipped = 0;
    const flagged: FlaggedTransaction[] = [];

    for (const [accountId, items] of byAccount.entries()) {
      if (items.length < MIN_SAMPLES_PER_ACCOUNT) {
        accountsSkipped++;
        continue;
      }
      accountsAnalyzed++;

      const values = items.map((it) => it.amount);
      const { keptIndices, mean, std } = sigmaClip(values);
      if (std === 0) continue;

      items.forEach((it, i) => {
        if (keptIndices.has(i)) return; // dentro del rango normal
        const entry = entryById.get(it.entryId);
        flagged.push({
          accountName: accountNameById.get(accountId) ?? "(cuenta sin nombre)",
          amount: it.amount,
          zScore: (it.amount - mean) / std,
          description: entry?.description ?? "(sin descripcion)",
          entryDate: entry?.entry_date ?? "",
          accountMean: mean,
          accountStd: std,
        });
      });
    }

    flagged.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

    setResult({ accountsAnalyzed, accountsSkipped, flagged });
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 24, border: "1px solid #2A3040", borderRadius: 12, padding: 20, background: "#0d1117" }}>
      <h3 style={{ margin: 0, fontSize: 16, color: "#7dd3fc" }}>Deteccion de anomalias por cuenta (sigma-clipping)</h3>
      <p style={{ marginTop: 6, fontSize: 12.5, color: "#8B93A7", maxWidth: 640 }}>
        Por cada cuenta contable, marca las transacciones que se alejan de forma significativa (mas de {SIGMA_THRESHOLD} desviaciones estandar) del comportamiento normal de esa cuenta especifica. Complementa a la Ley de Benford: Benford mira el patron global del primer digito, esto mira cada cuenta por separado.
      </p>

      <button
        onClick={runAnalysis}
        disabled={loading}
        style={{ marginTop: 12, padding: "10px 20px", background: "#7dd3fc", color: "#000a16", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Analizando..." : "Buscar transacciones atipicas"}
      </button>

      {error && <p style={{ marginTop: 12, fontSize: 13, color: "#facc15" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>
            {result.accountsAnalyzed} cuenta(s) analizada(s)
            {result.accountsSkipped > 0 && (
              <> &middot; {result.accountsSkipped} cuenta(s) con muy pocas transacciones para un analisis confiable (mínimo {MIN_SAMPLES_PER_ACCOUNT})</>
            )}
          </p>

          {result.flagged.length === 0 ? (
            <p style={{ marginTop: 12, fontSize: 13, color: "#4ade80", fontWeight: 700 }}>
              No se encontraron transacciones fuera de rango en las cuentas analizadas.
            </p>
          ) : (
            <>
              <p style={{ marginTop: 12, fontSize: 13, color: "#f87171", fontWeight: 700 }}>
                {result.flagged.length} transaccion(es) fuera del rango normal de su cuenta (señal de alerta, no prueba de fraude)
              </p>
              <div style={{ marginTop: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#8B93A7", borderBottom: "1px solid #2A3040" }}>
                      <th style={{ padding: "6px 8px" }}>Cuenta</th>
                      <th style={{ padding: "6px 8px" }}>Descripcion</th>
                      <th style={{ padding: "6px 8px" }}>Fecha</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Monto</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Promedio de la cuenta</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Z-score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.flagged.map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #1A1F2B" }}>
                        <td style={{ padding: "6px 8px", color: "#e5e7eb" }}>{f.accountName}</td>
                        <td style={{ padding: "6px 8px", color: "#e5e7eb" }}>{f.description}</td>
                        <td style={{ padding: "6px 8px", color: "#8B93A7" }}>{f.entryDate}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: "#e5e7eb" }}>{f.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: "#8B93A7" }}>{f.accountMean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: "#f87171", fontWeight: 700 }}>{f.zScore.toFixed(2)}&sigma;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}