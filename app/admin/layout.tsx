import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

// Unico usuario autorizado a ver cualquier pagina bajo /admin/*.
// Esto es el panel del propietario de la plataforma, no de administradores
// de empresas individuales (esos usan roles ADMIN a nivel de company_id,
// que es un concepto completamente distinto).
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData?.user) {
    redirect("/login");
  }

  const isOwner =
    userData.user.id === PLATFORM_OWNER_ID ||
    userData.user.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;

  if (!isOwner) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}