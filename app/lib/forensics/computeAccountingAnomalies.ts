import { supabase } from "@/app/lib/supabase";
import { modifiedZScores } from "./outlierMath";
import { MIN_SAMPLES_PER_ACCOUNT, Z_THRESHOLD, type FlaggedTransaction } from "./computeOutliersForCase";
import { EXPECTED_BENFORD, leadingDigit, bootstrapMadCI, conformityFromMad } from "./benfordMath";

// Diferenciador "auditoria continua": computeOutliersForCase.ts y
// computeBenfordForCase.ts SOLO corren sobre companies vinculadas a un
// caso forense reconstruido (company.reconstruction_case_id) -- nunca
// sobre la contabilidad real en vivo de un cliente. Esta funcion aplica
// la MISMA matematica (los mismos modulos probados, mismos umbrales) a
// cualquier company_id real, acotado a un rango de fechas -- pensada
// para correr en el momento de SOLICITAR el cierre de un periodo
// (app/accounting/period-close/page.tsx), para que las anomalias se vean
// ANTES de que el aprobador confirme, no meses despues en una auditoria
// externa.
export interface AccountingAnomaliesResult {
  // Chequeo mas fundamental que outliers/Benford: si cada asiento se
  // valida balanceado al guardarse (ver app/accounting/journal/page.tsx,
  // "El asiento no cuadra"), la suma de TODOS los debitos activos de la
  // empresa debe ser exactamente igual a la suma de todos los creditos,
  // de forma acumulada (no solo dentro del periodo) -- es la ecuacion
  // contable basica, Activo = Pasivo + Patrimonio, expresada en terminos
  // de debitos/creditos. Si no cuadra, algun modulo escribio journal_lines
  // sin pasar por esa validacion.
  balanceIntegrity: { totalDebit: number; totalCredit: number; difference: number; balanced: boolean };
  outliers: { accountsAnalyzed: number; accountsSkipped: number; flagged: FlaggedTransaction[] };
  benford: { applicable: boolean; sampleSize: number; conformity: string | null; reason: string | null };
}

export async function computeAccountingAnomalies(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<AccountingAnomaliesResult> {
  // --- Integridad de la ecuacion contable (acumulada hasta el fin del
  // periodo, no solo dentro del rango -- el balance general es
  // acumulativo por naturaleza) ---
  const { data: allActiveEntries } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "ACTIVE")
    .lte("entry_date", periodEnd);
  const allActiveIds = (allActiveEntries ?? []).map((e: any) => e.id);

  let totalDebit = 0;
  let totalCredit = 0;
  if (allActiveIds.length > 0) {
    const { data: allLines } = await supabase.from("journal_lines").select("debit, credit").in("journal_entry_id", allActiveIds);
    for (const l of allLines ?? []) {
      totalDebit += l.debit || 0;
      totalCredit += l.credit || 0;
    }
  }
  const difference = totalDebit - totalCredit;
  const balanceIntegrity = { totalDebit, totalCredit, difference, balanced: Math.abs(difference) < 0.01 };

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, description, entry_date")
    .eq("company_id", companyId)
    .eq("status", "ACTIVE")
    .gte("entry_date", periodStart)
    .lte("entry_date", periodEnd);

  const entryIds = (entries ?? []).map((e: any) => e.id);
  const entryById = new Map((entries ?? []).map((e: any) => [e.id, e]));

  if (entryIds.length === 0) {
    return {
      balanceIntegrity,
      outliers: { accountsAnalyzed: 0, accountsSkipped: 0, flagged: [] },
      benford: { applicable: false, sampleSize: 0, conformity: null, reason: "Sin asientos en el periodo." },
    };
  }

  const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_name").eq("company_id", companyId);
  const accountNameById = new Map((accounts ?? []).map((a: any) => [a.id, a.account_name]));

  const { data: lines } = await supabase
    .from("journal_lines")
    .select("journal_entry_id, account_id, debit, credit")
    .in("journal_entry_id", entryIds);

  // --- Deteccion de outliers (z-score modificado), por cuenta ---
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

  // --- Ley de Benford, sobre todos los montos del periodo ---
  const amounts = (lines ?? []).flatMap((l: any) => [l.debit, l.credit]).filter((v: number) => v && v > 0);
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let total = 0;
  for (const amount of amounts) {
    const digit = leadingDigit(amount);
    if (digit) {
      counts[digit - 1]++;
      total++;
    }
  }

  let benford: AccountingAnomaliesResult["benford"];
  if (total < 30) {
    benford = { applicable: false, sampleSize: total, conformity: null, reason: `Solo ${total} montos utilizables en el periodo (se necesitan ~30+ para que la Ley de Benford sea confiable).` };
  } else {
    const observed = counts.map((c) => (c / total) * 100);
    const mad = observed.reduce((sum, obs, i) => sum + Math.abs(obs - EXPECTED_BENFORD[i]), 0) / 9 / 100;
    benford = { applicable: true, sampleSize: total, conformity: conformityFromMad(mad), reason: null };
  }

  return {
    balanceIntegrity,
    outliers: { accountsAnalyzed, accountsSkipped, flagged },
    benford,
  };
}