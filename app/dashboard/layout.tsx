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

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role_id")
    .eq("user_id", user.id);

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