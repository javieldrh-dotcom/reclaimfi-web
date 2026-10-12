import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Lee y cambia el interruptor de modo mantenimiento (ver
// app/lib/supabase/maintenanceGate.ts y la migracion
// supabase/migrations/2026-10-11-platform-config.sql). Gateado al propietario de la
// plataforma, mismo patron que el resto de /api/admin/*. Escribe con
// service_role porque platform_config no tiene ninguna politica de
// insert/update/delete a proposito -- solo esta ruta puede cambiarlo.
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

export async function GET() {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await serviceClient
    .from("platform_config")
    .select("maintenance_mode, maintenance_message, updated_at")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, config: data });
}

export async function POST(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({} as any));
  const maintenanceMode: boolean | undefined = typeof body?.maintenanceMode === "boolean" ? body.maintenanceMode : undefined;
  const maintenanceMessage: string | undefined = typeof body?.maintenanceMessage === "string" ? body.maintenanceMessage.slice(0, 500) : undefined;

  if (maintenanceMode === undefined && maintenanceMessage === undefined) {
    return NextResponse.json({ success: false, error: "Nada que actualizar." }, { status: 400 });
  }

  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (maintenanceMode !== undefined) updatePayload.maintenance_mode = maintenanceMode;
  if (maintenanceMessage !== undefined) updatePayload.maintenance_message = maintenanceMessage;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await serviceClient
    .from("platform_config")
    .update(updatePayload)
    .eq("id", "default")
    .select("maintenance_mode, maintenance_message, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, config: data });
}
