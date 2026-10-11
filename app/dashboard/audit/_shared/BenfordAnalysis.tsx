"use client";

import { useState } from "react";
import { computeBenfordForCase, type BenfordResult as SharedBenfordResult } from "@/app/lib/forensics/computeBenfordForCase";
import type { BenfordConformity } from "@/app/lib/forensics/benfordMath";

// Ley de Benford: en datos financieros/contables que ocurren naturalmente
// (no fabricados), el primer digito de las cantidades sigue una
// distribucion logaritmica predecible (el digito 1 aparece ~30.1% de las
// veces, el 9 solo ~4.6%). Cuando alguien inventa o manipula numeros a
// mano, tiende a distribuirlos de forma mas uniforme sin darse cuenta,
// rompiendo ese patron. Es la prueba estadistica estandar de auditoria
// forense (Nigrini) para priorizar que revisar primero en un volumen
// grande de transacciones - util como señal de alerta, nunca como prueba
// de fraude por si sola.
//
// Fuente de datos: journal_lines (debito/credito) de la empresa de
// reconstruccion contable vinculada al caso (companies.reconstruction_case_id),
// generada en app/reports/[caseId]/reconstruct/page.tsx.

interface Props {
  caseId: string;
}

// El tipo del resultado y la logica de calculo ahora viven en
// computeBenfordForCase.ts (Fase 4), para que el reporte forense
// exportable use exactamente el mismo analisis que se muestra aqui.
type BenfordResult = SharedBenfordResult;

const CONFORMITY_LABEL: Record<BenfordConformity, { text: string; color: string }> = {
  ALTA: { text: "Conformidad alta con Ley de Benford (sin señales de manipulacion en los primeros digitos)", color: "#4ade80" },
  ACEPTABLE: { text: "Conformidad aceptable (dentro de rango normal)", color: "#4ade80" },
  MARGINAL: { text: "Conformidad marginal (revisar con atencion, no es concluyente)", color: "#facc15" },
  NO_CONFORME: { text: "No conforme con Ley de Benford (señal de alerta: priorizar revision manual de este caso)", color: "#f87171" },
};

export default function BenfordAnalysis({ caseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BenfordResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setResult(null);

    const { result, error: errorMsg } = await computeBenfordForCase(caseId);
    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
      return;
    }

    setResult(result);
    setLoading(false);
  }

  const maxPct = result ? Math.max(...result.observed, ...result.expected) : 0;

  return (
    <div style={{ marginTop: 24, border: "1px solid #2A3040", borderRadius: 12, padding: 20, background: "#0d1117" }}>
      <h3 style={{ margin: 0, fontSize: 16, color: "#7dd3fc" }}>Analisis de Benford (deteccion estadistica de anomalias)</h3>
      <p style={{ marginTop: 6, fontSize: 12.5, color: "#8B93A7", maxWidth: 640 }}>
        Compara la distribucion real del primer digito de los montos contables de este caso contra el patron esperado en datos financieros genuinos. Una desviacion fuerte no prueba fraude, pero es una señal objetiva de donde mirar primero.
      </p>

      <button
        onClick={runAnalysis}
        disabled={loading}
        style={{ marginTop: 12, padding: "10px 20px", background: "#7dd3fc", color: "#000a16", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Analizando..." : "Analizar con Ley de Benford"}
      </button>

      {error && <p style={{ marginTop: 12, fontSize: 13, color: "#facc15" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, color: CONFORMITY_LABEL[result.conformity].color, fontWeight: 700 }}>
            {CONFORMITY_LABEL[result.conformity].text}
          </p>
          <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 2 }}>
            Muestra: {result.sampleSize} montos &middot; Desviacion media absoluta (MAD): {(result.mad * 100).toFixed(3)} pts
            {" "}(IC 95%: {(result.madCiLow * 100).toFixed(2)} – {(result.madCiHigh * 100).toFixed(2)} pts)
          </p>
          {result.ciUnstable && (
            <p style={{ fontSize: 12, color: "#facc15", marginTop: 6, maxWidth: 640 }}>
              El intervalo de confianza cruza mas de una banda de conformidad (calculado por remuestreo
              bootstrap sobre los {result.sampleSize} montos). Con esta cantidad de transacciones, el
              resultado de arriba puede cambiar de categoria solo por variacion estadistica — no lo tomes
              como un veredicto firme todavia. Entre mas asientos tenga la reconstruccion contable, mas
              angosto (y confiable) sera este intervalo.
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "flex-end", height: 140 }}>
            {result.observed.map((obs, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 110 }}>
                  <div
                    title={"Observado: " + obs.toFixed(1) + "%"}
                    style={{ width: 12, height: (obs / maxPct) * 110, background: "#7dd3fc", borderRadius: "2px 2px 0 0" }}
                  />
                  <div
                    title={"Esperado (Benford): " + result.expected[i].toFixed(1) + "%"}
                    style={{ width: 12, height: (result.expected[i] / maxPct) * 110, background: "#374151", borderRadius: "2px 2px 0 0" }}
                  />
                </div>
                <span style={{ fontSize: 11, color: "#8B93A7" }}>{i + 1}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#8B93A7" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#7dd3fc", borderRadius: 2, marginRight: 4 }} />Observado (este caso)</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#374151", borderRadius: 2, marginRight: 4 }} />Esperado (Ley de Benford)</span>
          </div>
        </div>
      )}
    </div>
  );
}