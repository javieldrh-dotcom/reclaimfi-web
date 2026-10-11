import { supabase } from "@/app/lib/supabase";
import { EXPECTED_BENFORD, leadingDigit, bootstrapMadCI, conformityFromMad, type BenfordConformity } from "./benfordMath";

// Extraido de BenfordAnalysis.tsx (Fase 4 de la hoja de ruta) para que el
// reporte forense exportable (generateForensicReport.ts) pueda incluir el
// mismo analisis que ya se muestra en pantalla, sin duplicar la logica de
// carga de datos ni arriesgar que las dos copias diverjan con el tiempo.
// BenfordAnalysis.tsx ahora llama a esta misma funcion.
export interface BenfordResult {
  sampleSize: number;
  observed: number[];
  expected: number[];
  mad: number;
  conformity: BenfordConformity;
  madCiLow: number;
  madCiHigh: number;
  ciUnstable: boolean;
}

export async function computeBenfordForCase(caseId: string): Promise<{ result: BenfordResult | null; error: string | null }> {
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("reconstruction_case_id", caseId)
    .maybeSingle();

  if (!company) {
    return { result: null, error: "Este caso no tiene una reconstruccion contable generada todavia. Primero corre 'Reconstruccion Contable desde Evidencia'." };
  }

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("company_id", company.id);

  const entryIds = (entries ?? []).map((e: any) => e.id);
  if (entryIds.length === 0) {
    return { result: null, error: "La reconstruccion de este caso no tiene asientos contables todavia." };
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
    return { result: null, error: `Solo hay ${total} montos utilizables. La Ley de Benford necesita al menos ~30-50 transacciones para ser estadisticamente significativa; con esta muestra el resultado no es confiable.` };
  }

  const observed = counts.map((c) => (c / total) * 100);
  const mad = observed.reduce((sum, obs, i) => sum + Math.abs(obs - EXPECTED_BENFORD[i]), 0) / 9 / 100;

  const usableAmounts = amounts.filter((v: number) => leadingDigit(v) !== null);
  const { low: madCiLow, high: madCiHigh } = bootstrapMadCI(usableAmounts);
  const ciUnstable = conformityFromMad(madCiLow) !== conformityFromMad(madCiHigh);

  return {
    result: {
      sampleSize: total,
      observed,
      expected: EXPECTED_BENFORD,
      mad,
      conformity: conformityFromMad(mad),
      madCiLow,
      madCiHigh,
      ciUnstable,
    },
    error: null,
  };
}
