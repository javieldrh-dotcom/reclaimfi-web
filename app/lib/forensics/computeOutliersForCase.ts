import { supabase } from "@/app/lib/supabase";
import { modifiedZScores } from "./outlierMath";

// Extraido de OutlierAnalysis.tsx (Fase 4 de la hoja de ruta) por el
// mismo motivo que computeBenfordForCase.ts: el reporte forense
// exportable necesita el mismo analisis que ya se muestra en pantalla,
// sin una segunda copia de la logica de carga de datos.
// OutlierAnalysis.tsx ahora llama a esta misma funcion.
export interface FlaggedTransaction {
  accountName: string;
  amount: number;
  zScore: number;
  description: string;
  entryDate: string;
  accountTypicalAmount: number;
}

export interface OutlierResult {
  accountsAnalyzed: number;
  accountsSkipped: number;
  flagged: FlaggedTransaction[];
}

export const MIN_SAMPLES_PER_ACCOUNT = 5;
// Exportado (antes privado) para que computeAccountingAnomalies.ts use
// exactamente el mismo umbral en lugar de duplicarlo -- un solo numero
// "2.5" que define que es anomalo, no dos copias que puedan divergir.
export const Z_THRESHOLD = 2.5;

export async function computeOutliersForCase(caseId: string): Promise<{ result: OutlierResult | null; error: string | null }> {
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
    .select("id, description, entry_date")
    .eq("company_id", company.id);

  const entryIds = (entries ?? []).map((e: any) => e.id);
  if (entryIds.length === 0) {
    return { result: null, error: "La reconstruccion de este caso no tiene asientos contables todavia." };
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

    const logValues = items.map((it) => Math.log(it.amount));
    const { zScores, medianLog, mad } = modifiedZScores(logValues);
    if (mad === 0) continue;

    const accountTypicalAmount = Math.exp(medianLog);

    items.forEach((it, i) => {
      if (Math.abs(zScores[i]) <= Z_THRESHOLD) return;
      const entry = entryById.get(it.entryId);
      flagged.push({
        accountName: accountNameById.get(accountId) ?? "(cuenta sin nombre)",
        amount: it.amount,
        zScore: zScores[i],
        description: entry?.description ?? "(sin descripcion)",
        entryDate: entry?.entry_date ?? "",
        accountTypicalAmount,
      });
    });
  }

  flagged.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  return { result: { accountsAnalyzed, accountsSkipped, flagged }, error: null };
}