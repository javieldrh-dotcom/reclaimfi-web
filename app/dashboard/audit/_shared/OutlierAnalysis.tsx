"use client";

import { useState } from "react";
import { computeOutliersForCase, MIN_SAMPLES_PER_ACCOUNT, type OutlierResult as SharedOutlierResult } from "@/app/lib/forensics/computeOutliersForCase";

// Deteccion de anomalias por cuenta: la misma familia de tecnicas que
// usa Aletheia Ledger para descartar destellos y ruido instrumental en
// curvas de luz fotometricas, aplicada aqui a contabilidad. Por cada
// cuenta del plan de cuentas se mide que tan lejos esta cada monto del
// comportamiento normal de esa cuenta, y se marca lo que se sale de
// rango.
//
// OJO 1: el calculo corre sobre el LOGARITMO de cada monto, no sobre el
// monto crudo. Los montos contables (igual que el brillo de una
// estrella) no se distribuyen de forma simetrica: la mayoria son chicos
// y unos pocos son grandes (es la misma cola larga que describe la Ley
// de Benford). Medir sobre el monto crudo hace que esa cola natural
// dispare el umbral con facilidad sin que haya nada irregular - en una
// prueba con datos sinteticos, el 88% de lo marcado terminaba siendo
// ruido normal, no las anomalias reales. En escala logaritmica esa
// distribucion se vuelve mucho mas simetrica.
//
// OJO 2: se usa la MEDIANA y la Desviacion Absoluta Mediana (MAD) en vez
// de la media y la desviacion estandar clasicas ("Z-score modificado",
// Iglewicz & Hoaglin 1993). Con media/desviacion estandar probamos este
// mismo caso sintetico y el resultado fue el problema opuesto: los
// propios outliers que se intenta detectar "inflan" la desviacion
// estandar lo suficiente como para esconderse a si mismos (ni siquiera
// un fraude 100 veces mayor al normal se marcaba). La mediana y el MAD
// son estadisticas robustas - apenas se mueven por un puñado de valores
// extremos - por eso no sufren ese enmascaramiento.
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

// El tipo del resultado, el umbral de Z-score y la logica de calculo
// ahora viven en computeOutliersForCase.ts (Fase 4), para que el reporte
// forense exportable use exactamente el mismo analisis que se muestra
// aqui.
type OutlierResult = SharedOutlierResult;
const Z_THRESHOLD = 2.5;

export default function OutlierAnalysis({ caseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OutlierResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setResult(null);

    const { result, error: errorMsg } = await computeOutliersForCase(caseId);
    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
      return;
    }

    setResult(result);
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 24, border: "1px solid #2A3040", borderRadius: 12, padding: 20, background: "#0d1117" }}>
      <h3 style={{ margin: 0, fontSize: 16, color: "#7dd3fc" }}>Deteccion de anomalias por cuenta (Z-score robusto)</h3>
      <p style={{ marginTop: 6, fontSize: 12.5, color: "#8B93A7", maxWidth: 640 }}>
        Por cada cuenta contable, marca las transacciones que se alejan de forma significativa (Z-score modificado &gt; {Z_THRESHOLD}, por mediana y MAD en escala logaritmica) del comportamiento normal de esa cuenta especifica. Complementa a la Ley de Benford: Benford mira el patron global del primer digito, esto mira cada cuenta por separado.
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
              <> &middot; {result.accountsSkipped} cuenta(s) con muy pocas transacciones o sin dispersion para un analisis confiable (mínimo {MIN_SAMPLES_PER_ACCOUNT})</>
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
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Tipico de la cuenta</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Z-score modificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.flagged.map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #1A1F2B" }}>
                        <td style={{ padding: "6px 8px", color: "#e5e7eb" }}>{f.accountName}</td>
                        <td style={{ padding: "6px 8px", color: "#e5e7eb" }}>{f.description}</td>
                        <td style={{ padding: "6px 8px", color: "#8B93A7" }}>{f.entryDate}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: "#e5e7eb" }}>{f.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: "#8B93A7" }}>{f.accountTypicalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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