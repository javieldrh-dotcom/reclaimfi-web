"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

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

interface BenfordResult {
  sampleSize: number;
  observed: number[]; // indice 0 = digito 1, ... indice 8 = digito 9 (porcentaje)
  expected: number[];
  mad: number;
  conformity: "ALTA" | "ACEPTABLE" | "MARGINAL" | "NO_CONFORME";
  // Intervalo de confianza del 95% para el MAD, estimado por bootstrap
  // (remuestreo con reemplazo). Con muestras chicas (30-100 montos) un
  // solo valor de MAD puede ser ruido: dos corridas con los mismos datos
  // "reales" pueden caer en bandas de conformidad distintas solo por azar
  // de cual caso le toco auditar. El intervalo hace visible esa
  // incertidumbre en vez de esconderla detras de una sola etiqueta.
  madCiLow: number;
  madCiHigh: number;
  // true si el intervalo de confianza cruza mas de una banda de
  // conformidad (ej. el borde inferior cae en ACEPTABLE pero el
  // superior en NO_CONFORME) - señal de que la muestra es insuficiente
  // para un veredicto firme, no que el resultado sea invalido.
  ciUnstable: boolean;
}

const EXPECTED_BENFORD = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d) * 100);
const BOOTSTRAP_ITERATIONS = 1000;

function leadingDigit(value: number): number | null {
  let n = Math.abs(value);
  if (!n || !isFinite(n)) return null;
  while (n < 1) n *= 10;
  while (n >= 10) n /= 10;
  const digit = Math.floor(n);
  return digit >= 1 && digit <= 9 ? digit : null;
}

function madFromAmounts(amounts: number[]): number | null {
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let total = 0;
  for (const amount of amounts) {
    const digit = leadingDigit(amount);
    if (digit) {
      counts[digit - 1]++;
      total++;
    }
  }
  if (total === 0) return null;
  const observed = counts.map((c) => (c / total) * 100);
  return observed.reduce((sum, obs, i) => sum + Math.abs(obs - EXPECTED_BENFORD[i]), 0) / 9 / 100;
}

// Bootstrap no parametrico (mismo principio que el remuestreo que usa
// Aletheia Ledger para estimar incertidumbre en mediciones con pocos
// puntos de datos): se arman muchas "muestras alternativas" tomando
// montos al azar CON reemplazo del mismo conjunto, se calcula el MAD de
// cada una, y el intervalo de confianza del 95% son los percentiles
// 2.5 y 97.5 de esa distribucion de MADs simulados.
function bootstrapMadCI(amounts: number[], iterations = BOOTSTRAP_ITERATIONS): { low: number; high: number } {
  const n = amounts.length;
  const mads: number[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    const resample: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      resample[i] = amounts[Math.floor(Math.random() * n)];
    }
    const mad = madFromAmounts(resample);
    if (mad !== null) mads.push(mad);
  }
  mads.sort((a, b) => a - b);
  if (mads.length === 0) return { low: 0, high: 0 };
  const lowIdx = Math.floor(mads.length * 0.025);
  const highIdx = Math.min(mads.length - 1, Math.floor(mads.length * 0.975));
  return { low: mads[lowIdx], high: mads[highIdx] };
}

function conformityFromMad(mad: number): BenfordResult["conformity"] {
  // Umbrales de Nigrini para el test del primer digito (MAD expresado
  // como fraccion, ej. 0.006 = 0.6 puntos porcentuales de desviacion
  // promedio entre lo observado y lo esperado).
  if (mad < 0.006) return "ALTA";
  if (mad < 0.012) return "ACEPTABLE";
  if (mad < 0.015) return "MARGINAL";
  return "NO_CONFORME";
}

const CONFORMITY_LABEL: Record<BenfordResult["conformity"], { text: string; color: string }> = {
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
      .select("id")
      .eq("company_id", company.id);

    const entryIds = (entries ?? []).map((e: any) => e.id);
    if (entryIds.length === 0) {
      setError("La reconstruccion de este caso no tiene asientos contables todavia.");
      setLoading(false);
      return;
    }

    const { data: lines } = await supabase
      .from("journal_lines")
      .select("debit, credit")
      .in("journal_entry_id", entryIds);

    const amounts = (lines ?? [])
      .flatMap((l: any) => [l.debit, l.credit])
      .filter((v: number) => v && v > 0);

    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let total = 0;
    for (const amount of amounts) {
      const digit = leadingDigit(amount);
      if (digit) {
        counts[digit - 1]++;
        total++;
      }
    }

    if (total < 30) {
      setError(`Solo hay ${total} montos utilizables. La Ley de Benford necesita al menos ~30-50 transacciones para ser estadisticamente significativa; con esta muestra el resultado no es confiable.`);
      setLoading(false);
      return;
    }

    const observed = counts.map((c) => (c / total) * 100);
    const mad = observed.reduce((sum, obs, i) => sum + Math.abs(obs - EXPECTED_BENFORD[i]), 0) / 9 / 100;

    const usableAmounts = amounts.filter((v: number) => leadingDigit(v) !== null);
    const { low: madCiLow, high: madCiHigh } = bootstrapMadCI(usableAmounts);
    const ciUnstable = conformityFromMad(madCiLow) !== conformityFromMad(madCiHigh);

    setResult({
      sampleSize: total,
      observed,
      expected: EXPECTED_BENFORD,
      mad,
      conformity: conformityFromMad(mad),
      madCiLow,
      madCiHigh,
      ciUnstable,
    });
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