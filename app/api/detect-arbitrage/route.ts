import { NextResponse } from "next/server";
import { analyzeArbitragePattern, FlaggedTransaction } from "@/app/core/agents/arbitrageAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const { companyId } = await request.json();
    if (!companyId) {
      return NextResponse.json({ success: false, error: "Falta la empresa." }, { status: 400 });
    }

    const { data: membership } = await supabase.from("user_companies").select("id").eq("user_id", userData.user.id).eq("company_id", companyId).maybeSingle();
    if (!membership) {
      return NextResponse.json({ success: false, error: "No tienes acceso a esta empresa." }, { status: 403 });
    }

    const { data: company } = await supabase.from("companies").select("functional_currency").eq("id", companyId).single();
    const currency = company?.functional_currency || "USD";

    const { data: rates } = await supabase
      .from("exchange_rates")
      .select("rate_date, rate_value")
      .eq("from_currency", currency)
      .order("rate_date", { ascending: true });

    if (!rates || rates.length < 2) {
      return NextResponse.json({ success: true, result: { riskLevel: "LOW", findings: [], recommendation: "No hay suficiente historial de tasas de cambio registrado para " + currency + " como para realizar este analisis." }, flaggedCount: 0 });
    }

    const significantChanges: { date: string; before: number; after: number }[] = [];
    for (let i = 1; i < rates.length; i++) {
      const pctChange = Math.abs((rates[i].rate_value - rates[i - 1].rate_value) / rates[i - 1].rate_value);
      if (pctChange > 0.05) {
        significantChanges.push({ date: rates[i].rate_date, before: rates[i - 1].rate_value, after: rates[i].rate_value });
      }
    }

    const { data: entries } = await supabase
      .from("journal_entries")
      .select("id, description, entry_date, exchange_rate, journal_lines(debit)")
      .eq("company_id", companyId)
      .order("entry_date", { ascending: true });

    const flaggedTransactions: FlaggedTransaction[] = [];
    const DAY_MS = 24 * 60 * 60 * 1000;
    const WINDOW_DAYS = 3;
    const MIN_AMOUNT = 200;

    for (const entry of entries ?? []) {
      const amount = (entry.journal_lines ?? []).reduce((s: number, l: any) => s + (l.debit || 0), 0);
      if (amount < MIN_AMOUNT) continue;

      const entryDate = new Date(entry.entry_date).getTime();
      let nearest: { date: string; before: number; after: number; diffDays: number } | null = null;

      for (const change of significantChanges) {
        const diffDays = Math.abs(entryDate - new Date(change.date).getTime()) / DAY_MS;
        if (diffDays <= WINDOW_DAYS && (!nearest || diffDays < nearest.diffDays)) {
          nearest = { ...change, diffDays };
        }
      }

      if (nearest) {
        flaggedTransactions.push({
          date: entry.entry_date,
          description: entry.description,
          amount,
          exchangeRateUsed: entry.exchange_rate || 0,
          nearestRateChangeDate: nearest.date,
          rateBeforeChange: nearest.before,
          rateAfterChange: nearest.after,
          daysFromChange: Math.round(nearest.diffDays),
        });
      }
    }

    const result = await analyzeArbitragePattern(currency, flaggedTransactions.slice(0, 30));

    if (result.riskLevel === "MEDIUM" || result.riskLevel === "HIGH") {
      await supabase.from("arbitrage_signals").insert([{
        company_id: companyId,
        currency,
        risk_level: result.riskLevel,
        findings_summary: result.findings.join(" | "),
      }]);
    }

    return NextResponse.json({ success: true, result, flaggedCount: flaggedTransactions.length, significantRateChanges: significantChanges.length });
  } catch (error: any) {
    console.error("DETECT ARBITRAGE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}