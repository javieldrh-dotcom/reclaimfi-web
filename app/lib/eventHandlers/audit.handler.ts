import { createClient } from "../supabase/server";

export async function auditHandler(event: any) {
  if (!event.type.startsWith("rf.")) return;

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

  const { error } = await supabase.from("audit_logs").insert([
    {
      module: "event_bus",
      action: event.type,
      new_data: event.payload,
      user_id: userData?.user?.id ?? null,
      company_id: companyId,
    },
  ]);

  if (error) {
    console.error("[AUDIT HANDLER ERROR]", error);
  }
}