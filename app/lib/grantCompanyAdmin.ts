import type { SupabaseClient } from "@supabase/supabase-js";

// Otorga la membresia (user_companies) Y el rol real que las politicas de
// RLS verifican (user_role_assignments -> user_roles.name = 'ADMIN') al
// crear una empresa nueva.
//
// CRITICO: user_companies.role es un campo LEGADO que NINGUNA politica de
// RLS lee. is_company_member(company_id) solo confirma que existe una
// fila en user_companies (pertenencia); get_user_role(company_id) lee de
// user_role_assignments -> user_roles.name, una tabla completamente
// separada. Insertar solo en user_companies (con o sin "role: ADMIN" en
// esa fila) NO otorga ningun permiso de escritura -- el usuario queda
// "miembro" de la empresa pero sin rol real, y cualquier insert/update/
// delete en una tabla con politica "write_admin_contador_*" (chart_of_accounts,
// journal_entries, etc.) falla con "new row violates row-level security
// policy", en el mejor caso de forma visible y en el peor en silencio si
// el llamador no revisa el error de ese insert puntual.
//
// Se descubrio este gap el 2026-10-16: Javiel reporto el error de RLS al
// crear una cuenta contable manualmente en empresas que el mismo habia
// creado por /admin/companies/new (que SI otorga el rol correctamente) --
// la causa real resulto ser que su fila en user_companies tenia
// role='owner' (el default legado de la columna) en vez de tener una fila
// en user_role_assignments. Al auditar donde mas se crea una empresa +
// membresia, se encontraron otros 3 flujos con el MISMO gap estructural:
// /api/subscriptions/request, /api/subscriptions/paypal-confirm (ambos
// alimentan el alta de un usuario pagante real) y
// /reports/[caseId]/reconstruct (reconstruccion forense). Este helper
// centraliza la logica correcta (ya existia, hecha a mano, en
// admin/companies/new/page.tsx) para que no se repita el gap en un futuro
// flujo nuevo.
export async function grantCompanyAdmin(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  options?: { lastActiveAt?: string }
): Promise<{ success: boolean; error?: string }> {
  const { error: membershipError } = await supabase.from("user_companies").insert([{
    user_id: userId,
    company_id: companyId,
    last_active_at: options?.lastActiveAt ?? new Date().toISOString(),
  }]);
  if (membershipError) {
    return { success: false, error: "No se pudo asociar el usuario a la empresa (user_companies): " + membershipError.message };
  }

  const { data: adminRole, error: roleLookupError } = await supabase.from("user_roles").select("id").eq("name", "ADMIN").single();
  if (roleLookupError || !adminRole) {
    return { success: false, error: "No se encontro el rol ADMIN en el sistema: " + (roleLookupError?.message ?? "sin rol ADMIN") };
  }
  const { error: roleAssignError } = await supabase.from("user_role_assignments").insert([{
    user_id: userId,
    role_id: adminRole.id,
    company_id: companyId,
  }]);
  if (roleAssignError) {
    return { success: false, error: "No se pudo asignar el rol ADMIN (user_role_assignments): " + roleAssignError.message };
  }
  return { success: true };
}