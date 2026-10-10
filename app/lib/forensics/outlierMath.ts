// Logica pura (sin React, sin Supabase) de la deteccion de anomalias por
// cuenta usada en OutlierAnalysis.tsx: mediana + MAD (Median Absolute
// Deviation) en escala logaritmica para calcular un "Z-score modificado"
// (Iglewicz & Hoaglin 1993), robusto frente a los mismos outliers que se
// quiere detectar. Vive aqui, separado del componente, para poder probarla
// con un dataset fijo sin levantar React ni Supabase (Fase 3 de la hoja de
// ruta: estos son exactamente los calculos que ya se rompieron 2 veces en
// esta sesion por enmascaramiento estadistico antes de llegar a esta forma).

export const MAD_SCALE_FACTOR = 1.4826;

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface ModifiedZScoreResult {
  zScores: number[];
  medianLog: number;
  mad: number;
}

// logValues: montos ya transformados con Math.log(amount) por el llamador.
export function modifiedZScores(logValues: number[]): ModifiedZScoreResult {
  const medianLog = median(logValues);
  const absDeviations = logValues.map((v) => Math.abs(v - medianLog));
  const mad = median(absDeviations);
  if (mad === 0) {
    return { zScores: logValues.map(() => 0), medianLog, mad };
  }
  const zScores = logValues.map((v) => (v - medianLog) / (MAD_SCALE_FACTOR * mad));
  return { zScores, medianLog, mad };
}