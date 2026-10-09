import { supabase } from "@/app/lib/supabase";

// Resuelve la empresa activa del usuario autenticado y los casos que le
// pertenecen. Centraliza un patron que antes estaba copiado en decenas de
// paginas, para que el filtrado multiempresa (incluido el de las
// suscripciones de Realtime) use siempre la misma fuente de verdad.
export async function getActiveCompanyContext(): Promise<{
  companyId: string | null;
  caseIds: string[];
}> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { companyId: null, caseIds: [] };

  const { data: uc } = await supabase
    .from("user_companies")
    .select("company_id")
    .eq("user_id", userData.user.id)
    .order("last_active_at", { ascending: false })
    .limit(1)
    .single();

  const companyId = uc?.company_id ?? null;
  if (!companyId) return { companyId: null, caseIds: [] };

  const { data: casesList } = await supabase
    .from("cases")
    .select("id")
    .eq("company_id", companyId);

  const caseIds = (casesList ?? []).map((c: any) => c.id);
  return { companyId, caseIds };
}
