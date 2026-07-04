import { createClient } from "../supabase/server";

export async function riskHandler(event: any) {
  if (event.type !== "rf.risk.calculated") return;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let companyId: string | null = null;
  if (userData?.user) {
    const { data: userCompany } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .single();
    companyId = userCompany?.company_id ?? null;
  }

  if (!companyId) {
    console.error("[RISK HANDLER ERROR] No company_id resolved, skipping insert");
    return;
  }

  const { error } = await supabase.from("risk_scores").insert([
    {
      aml_score: event.payload.aml_score ?? null,
      operational_score: event.payload.operational_score ?? event.payload.anomalyScore ?? null,
      tax_score: event.payload.tax_score ?? null,
      cyber_score: event.payload.cyber_score ?? null,
      total_score: event.payload.total_score ?? event.payload.anomalyScore ?? null,
      generated_by: "EVENT_BUS",
      company_id: companyId,
    },
  ]);

  if (error) {
    console.error("[RISK HANDLER ERROR]", error);
  }
}