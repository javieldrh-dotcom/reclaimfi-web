import { supabase } from "@/app/lib/supabase";

// Diferenciador "radar de riesgo-pais": el motor de reexpresion por
// inflacion (app/accounting/hyperinflation/page.tsx) ya es global (keyed
// por country_code + index_name en price_indices), pero hasta ahora solo
// se usaba de forma reactiva -- el contador tenia que acordarse de entrar
// y correrlo. Esta funcion mide la inflacion acumulada de los ultimos 36
// meses (el indicador cuantitativo de referencia de NIC 29 parrafo 3(f):
// "una tasa acumulada de inflacion en tres anios que se aproxima o
// sobrepasa el 100%") y clasifica el riesgo, para avisar ANTES de que la
// empresa cruce el umbral de reexpresion obligatoria, no despues.
export type HyperinflationRiskLevel = "SIN_DATOS" | "NORMAL" | "VIGILANCIA" | "ALERTA" | "ACTIVA";

export interface HyperinflationRiskResult {
  level: HyperinflationRiskLevel;
  cumulative36MonthPct: number | null;
  latestDate: string | null;
  baselineDate: string | null;
  monthsOfHistory: number;
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export async function computeHyperinflationRisk(
  countryCode: string,
  indexName: string
): Promise<HyperinflationRiskResult> {
  const { data: rows } = await supabase
    .from("price_indices")
    .select("index_value, period_date")
    .eq("country_code", countryCode)
    .eq("index_name", indexName)
    .order("period_date", { ascending: true });

  if (!rows || rows.length === 0) {
    return { level: "SIN_DATOS", cumulative36MonthPct: null, latestDate: null, baselineDate: null, monthsOfHistory: 0 };
  }

  const byMonth = new Map<string, number>();
  for (const r of rows) byMonth.set(monthKey(r.period_date), r.index_value);
  const months = Array.from(byMonth.keys()).sort();

  const latestMonth = months[months.length - 1];
  const latestValue = byMonth.get(latestMonth)!;

  // Mes "36 meses atras" por calendario, no por conteo de filas (puede
  // haber huecos si no se cargo el indice de algun mes).
  const [ly, lm] = latestMonth.split("-").map(Number);
  const baselineDateObj = new Date(ly, lm - 1 - 36, 1);
  const baselineTarget = `${baselineDateObj.getFullYear()}-${String(baselineDateObj.getMonth() + 1).padStart(2, "0")}`;

  // Usa el mes mas cercano disponible <= al objetivo de 36 meses atras,
  // igual que la logica de "mejor indice disponible" de la pantalla de
  // reexpresion -- si no hay ningun mes esa antiguo, no hay suficiente
  // historia para medir la tasa acumulada de 3 anios.
  let baselineMonth: string | null = null;
  for (const m of months) {
    if (m <= baselineTarget) baselineMonth = m;
    else break;
  }

  if (!baselineMonth) {
    return {
      level: "SIN_DATOS",
      cumulative36MonthPct: null,
      latestDate: latestMonth,
      baselineDate: null,
      monthsOfHistory: months.length,
    };
  }

  const baselineValue = byMonth.get(baselineMonth)!;
  const cumulativePct = ((latestValue / baselineValue) - 1) * 100;

  let level: HyperinflationRiskLevel;
  if (cumulativePct >= 100) level = "ACTIVA";
  else if (cumulativePct >= 80) level = "ALERTA";
  else if (cumulativePct >= 50) level = "VIGILANCIA";
  else level = "NORMAL";

  return { level, cumulative36MonthPct: cumulativePct, latestDate: latestMonth, baselineDate: baselineMonth, monthsOfHistory: months.length };
}