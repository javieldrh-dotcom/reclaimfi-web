import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Lectura/edicion de TODAS las empresas de la plataforma (no solo las del
// propietario), gateado al propietario, mismo patron que
// app/api/admin/jurisdiction-modules/route.ts. Se necesita service_role
// porque la RLS de companies ("select_own_companies"/"update_own_company")
// solo deja ver/editar una empresa a quien es owner_id o miembro de ella
// -- un contador cualquiera crea sus propias empresas con su propio
// owner_id, asi que el dueno de la plataforma NO puede verlas con el
// cliente normal aunque sea el dueno de la plataforma. Esta ruta es la
// unica forma de que exista un panel de administracion real sobre
// centenares de empresas de distintos contadores.
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

async function requireOwner() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const isOwner =
    userData?.user?.id === PLATFORM_OWNER_ID ||
    userData?.user?.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;
  return isOwner;
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();

  let query = serviceClient()
    .from("companies")
    .select("id, name, tax_id, country, jurisdiction_code, industry_sector, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.ilike("name", "%" + search + "%");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, companies: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({} as any));
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ success: false, error: "id es obligatorio." }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (typeof body?.jurisdiction_code === "string") updates.jurisdiction_code = body.jurisdiction_code.trim().toUpperCase();
  if (typeof body?.country === "string") updates.country = body.country.trim().toUpperCase();
  if (typeof body?.industry_sector === "string") updates.industry_sector = body.industry_sector.trim().toUpperCase();
  if (typeof body?.name === "string" && body.name.trim()) updates.name = body.name.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No se envio ningun campo para actualizar." }, { status: 400 });
  }

  const { error } = await serviceClient().from("companies").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
