import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// CRUD de jurisdiction_modules para app/admin/jurisdiction-modules/page.tsx.
// Gateado al propietario de la plataforma, mismo patron que
// app/api/admin/maintenance/route.ts. Escribe con service_role porque
// jurisdiction_modules a proposito no tiene ninguna politica de
// insert/update/delete (ver supabase/migrations/2026-10-15-jurisdiction-modules-schema-and-rls.sql)
// -- la lectura si es publica (select abierto), asi que la pantalla de
// admin puede seguir leyendo con el cliente normal; solo las escrituras
// pasan por aqui.
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

export async function POST(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({} as any));
  const jurisdictionCode = typeof body?.jurisdiction_code === "string" ? body.jurisdiction_code.trim().toUpperCase() : "";
  const moduleKey = typeof body?.module_key === "string" ? body.module_key.trim().toUpperCase() : "";
  const config = body?.config;
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : true;

  if (!jurisdictionCode || !moduleKey) {
    return NextResponse.json({ success: false, error: "jurisdiction_code y module_key son obligatorios." }, { status: 400 });
  }
  if (typeof config !== "object" || config === null) {
    return NextResponse.json({ success: false, error: "config debe ser un objeto JSON." }, { status: 400 });
  }

  const { error } = await serviceClient()
    .from("jurisdiction_modules")
    .upsert(
      { jurisdiction_code: jurisdictionCode, module_key: moduleKey, config, enabled, updated_at: new Date().toISOString() },
      { onConflict: "jurisdiction_code,module_key" }
    );

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({} as any));
  const jurisdictionCode = typeof body?.jurisdiction_code === "string" ? body.jurisdiction_code.trim().toUpperCase() : "";
  const moduleKey = typeof body?.module_key === "string" ? body.module_key.trim().toUpperCase() : "";
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;

  if (!jurisdictionCode || !moduleKey || enabled === undefined) {
    return NextResponse.json({ success: false, error: "jurisdiction_code, module_key y enabled son obligatorios." }, { status: 400 });
  }

  const { error } = await serviceClient()
    .from("jurisdiction_modules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("jurisdiction_code", jurisdictionCode)
    .eq("module_key", moduleKey);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const jurisdictionCode = (searchParams.get("jurisdiction_code") || "").trim().toUpperCase();
  const moduleKey = (searchParams.get("module_key") || "").trim().toUpperCase();

  if (!jurisdictionCode || !moduleKey) {
    return NextResponse.json({ success: false, error: "jurisdiction_code y module_key son obligatorios." }, { status: 400 });
  }

  const { error } = await serviceClient()
    .from("jurisdiction_modules")
    .delete()
    .eq("jurisdiction_code", jurisdictionCode)
    .eq("module_key", moduleKey);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
