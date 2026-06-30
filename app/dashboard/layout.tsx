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

  return (
    <>
      <RealtimeInitializer />
      {children}
    </>
  );
}
