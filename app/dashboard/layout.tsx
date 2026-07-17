import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import RealtimeInitializer from "@/app/components/RealtimeInitializer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: userCompany } = await supabase
    .from("user_companies")
    .select("company_id")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  if (userCompany?.company_id) {
    const { data: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("id, status, expires_at")
      .eq("company_id", userCompany.company_id)
      .eq("status", "ACTIVE");

    const hasValidSubscription = (activeSubscriptions ?? []).some(
      (s: any) => !s.expires_at || new Date(s.expires_at) >= new Date()
    );

    if (!hasValidSubscription) {
      redirect("/subscribe");
    }
  } else {
    redirect("/subscribe");
  }

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role_id")
    .eq("user_id", user!.id);
  if (!assignments || assignments.length === 0) {
    redirect("/select-module");
  }

  return (
    <>
      <RealtimeInitializer />
      {children}
    </>
  );
}