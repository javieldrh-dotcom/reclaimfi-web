import { supabase } from "../supabase";

export async function auditHandlerClient(event: any) {
  if (!event.type.startsWith("rf.")) return;

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

  const caseId =
    event.payload?.case_id ??
    event.payload?.caseId ??
    (event.type === "rf.case.observed" ? event.payload?.id : null) ??
    null;
    
  const { error } = await supabase.from("audit_logs").insert([
    {
      module: "realtime_bridge",
      action: event.type,
      new_data: event.payload,
      user_id: userData?.user?.id ?? null,
      company_id: companyId,
      case_id: caseId,
    },
  ]);

  if (error) {
    console.error("[AUDIT CLIENT HANDLER ERROR]", error);
  }
}