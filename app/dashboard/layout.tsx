import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import RealtimeInitializer from "@/app/components/RealtimeInitializer";

// Dueno de la plataforma (ver app/admin/layout.tsx): opera y prueba el
// negocio, no es un cliente, asi que no debe quedar atrapado por el mismo
// candado de suscripcion/rol que protege este modulo para clientes.
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

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

  const isOwner =
    user!.id === PLATFORM_OWNER_ID ||
    user!.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;
  if (isOwner) {
    return (
      <>
        <RealtimeInitializer />
        {children}
      </>
    );
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
