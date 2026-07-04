import { createClient } from "../supabase/server";

export async function alertsHandler(event: any) {
  if (event.type !== "rf.alert.created") return;

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

  const { error } = await supabase.from("alerts").insert([
    {
      alert_type: event.payload.alert_type ?? event.payload.classification ?? "GENERAL",
      severity: event.payload.severity ?? event.payload.riskLevel ?? "LOW",
      title: event.payload.title ?? `Alert: ${event.payload.fileName ?? "unknown"}`,
      description: event.payload.description ?? JSON.stringify(event.payload),
      source_engine: "EVENT_BUS",
      status: "OPEN",
      company_id: companyId,
    },
  ]);

  if (error) {
    console.error("[ALERTS HANDLER ERROR]", error);
  }
}