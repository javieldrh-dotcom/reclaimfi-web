// Logica pura (sin React, sin Supabase) del test de Benford usado en
// BenfordAnalysis.tsx: MAD del primer digito + intervalo de confianza por
// bootstrap. Separada del componente para poder probarla con datasets
// fijos (Fase 3 de la hoja de ruta).

export type BenfordConformity = "ALTA" | "ACEPTABLE" | "MARGINAL" | "NO_CONFORME";

export const EXPECTED_BENFORD = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d) * 100);
export const BOOTSTRAP_ITERATIONS = 1000;

export function leadingDigit(value: number): number | null {
  let n = Math.abs(value);
  if (!n || !isFinite(n)) return null;
  while (n < 1) n *= 10;
  while (n >= 10) n /= 10;
  const digit = Math.floor(n);
  return digit >= 1 && digit <= 9 ? digit : null;
}

export function madFromAmounts(amounts: number[]): number | null {
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

// Bootstrap no parametrico: se arman muchas "muestras alternativas"
// tomando montos al azar CON reemplazo del mismo conjunto, se calcula el
// MAD de cada una, y el intervalo de confianza del 95% son los
// percentiles 2.5 y 97.5 de esa distribucion de MADs simulados.
//
// `rng` es inyectable (por defecto Math.random) solo para que las
// pruebas puedan fijar una secuencia determinista; el llamador real
// (BenfordAnalysis.tsx) nunca lo pasa y se comporta exactamente igual
// que antes de esta extraccion.
export function bootstrapMadCI(
  amounts: number[],
  iterations: number = BOOTSTRAP_ITERATIONS,
  rng: () => number = Math.random
): { low: number; high: number } {
  const n = amounts.length;
  const mads: number[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    const resample: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      resample[i] = amounts[Math.floor(rng() * n)];
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

// Umbrales de Nigrini para el test del primer digito (MAD expresado como
// fraccion, ej. 0.006 = 0.6 puntos porcentuales de desviacion promedio
// entre lo observado y lo esperado).
export function conformityFromMad(mad: number): BenfordConformity {
  if (mad < 0.006) return "ALTA";
  if (mad < 0.012) return "ACEPTABLE";
  if (mad < 0.015) return "MARGINAL";
  return "NO_CONFORME";
}