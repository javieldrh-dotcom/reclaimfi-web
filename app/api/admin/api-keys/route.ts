import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Gestion de claves de API para socios externos (ej. Chainalysis).
// external_api_keys no tiene ninguna politica RLS a proposito, igual que
// platform_config: solo se lee/escribe aqui, en el servidor, con
// service_role y verificando primero que quien llama es el propietario.
// app/admin/api-keys/page.tsx (el "use client") NUNCA toca esta tabla
// directamente -- antes de esta ruta lo intentaba con el cliente normal,
// y como no hay ninguna politica RLS, listar/crear/activar claves fallaba
// siempre en silencio (ver auditoria de Fase 3).
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

export async function GET() {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const { data, error } = await serviceClient()
    .from("external_api_keys")
    .select("id, partner_name, is_active, created_at, last_used_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, keys: data ?? [] });
}

export async function POST(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const { partnerName } = await request.json().catch(() => ({}));
  if (!partnerName || typeof partnerName !== "string" || !partnerName.trim()) {
    return NextResponse.json({ success: false, error: "Falta el nombre del socio." }, { status: 400 });
  }

  // El valor en texto plano (rawKey) solo existe en esta respuesta -- solo
  // se guarda el hash (key_hash) en la base, igual que una contrasena. Si
  // el usuario pierde este valor, no hay forma de recuperarlo, solo de
  // generar una clave nueva.
  const rawKey = "rfi_" + crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const { error } = await serviceClient()
    .from("external_api_keys")
    .insert([{ key_hash: keyHash, partner_name: partnerName.trim() }]);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, rawKey });
}

export async function PATCH(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const { id, isActive } = await request.json().catch(() => ({}));
  if (!id || typeof isActive !== "boolean") {
    return NextResponse.json({ success: false, error: "Faltan id o isActive." }, { status: 400 });
  }
  const { error } = await serviceClient()
    .from("external_api_keys")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

