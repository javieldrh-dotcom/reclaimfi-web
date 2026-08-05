import { NextResponse } from "next/server";
import { answerAccountingQuestion } from "@/app/core/agents/accountingChatAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "chat-query", p_max_requests: 20, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas preguntas seguidas. Espera un momento antes de continuar (maximo 20 por minuto)." }, { status: 429 });
    }

    const { question } = await request.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ success: false, error: "Falta la pregunta." }, { status: 400 });
    }

    const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
    const cid = uc?.company_id;
    if (!cid) {
      return NextResponse.json({ success: false, error: "No se encontro una empresa activa." }, { status: 400 });
    }

    const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();

    const { data: accountsData } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type")
      .eq("company_id", cid)
      .not("account_type", "in", "(ORDER_DEBTOR,ORDER_CREDITOR)");
    const accountIds = (accountsData ?? []).map((a: any) => a.id);

    const { data: lines } = await supabase
      .from("journal_lines")
      .select("debit, credit, account_id, journal_entries!inner(status)")
      .in("account_id", accountIds)
      .eq("journal_entries.status", "ACTIVE");

    const balances: Record<string, number> = {};
    (lines ?? []).forEach((l: any) => {
      balances[l.account_id] = (balances[l.account_id] || 0) + (l.debit || 0) - (l.credit || 0);
    });

    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0, totalRevenue = 0, totalExpense = 0;
    const accountBalances = (accountsData ?? []).map((a: any) => {
      let bal = balances[a.id] || 0;
      if (a.account_type === "LIABILITY" || a.account_type === "EQUITY" || a.account_type === "REVENUE") bal = -bal;
      if (a.account_type === "ASSET") totalAssets += bal;
      if (a.account_type === "LIABILITY") totalLiabilities += bal;
      if (a.account_type === "EQUITY") totalEquity += bal;
      if (a.account_type === "REVENUE") totalRevenue += bal;
      if (a.account_type === "EXPENSE") totalExpense += bal;
      return { code: a.account_code, name: a.account_name, type: a.account_type, balance: bal };
    }).filter((a: any) => Math.abs(a.balance) > 0.01);

    const answer = await answerAccountingQuestion({
      companyName: companyData?.name ?? "",
      currency: companyData?.functional_currency ?? "USD",
      accountBalances,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenueYTD: totalRevenue,
      totalExpenseYTD: totalExpense,
    }, question);

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error("CHAT QUERY ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}