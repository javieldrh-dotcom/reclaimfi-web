import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";

// RUTA DE DIAGNOSTICO TEMPORAL -- creada para investigar el error
// "supabaseKey is required" en app/api/track-visit/route.ts (y
// potencialmente en todas las rutas que usan SUPABASE_SERVICE_ROLE_KEY).
// No expone el valor completo de ninguna llave, solo si existe, su
// longitud y sus primeros caracteres (suficiente para confirmar que es un
// JWT real y no un valor vacio/truncado), mas el entorno de Vercel que ve
// esta funcion en tiempo de ejecucion.
//
// Eliminar este archivo en cuanto termine el diagnostico -- no debe
// quedar en produccion de forma permanente.
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

export async function GET() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();

  const isOwner =
    userData?.user?.id === PLATFORM_OWNER_ID ||
    userData?.user?.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;

  if (!isOwner) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envKeysWithSupabase = Object.keys(process.env).filter((k) => k.toUpperCase().includes("SUPABASE"));

  return NextResponse.json({
    success: true,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    hasServiceRoleKey: !!serviceKey,
    serviceRoleKeyLength: serviceKey?.length ?? 0,
    serviceRoleKeyPrefix: serviceKey ? serviceKey.slice(0, 6) : null,
    hasSupabaseUrl: !!supabaseUrl,
    supabaseUrlValue: supabaseUrl ?? null,
    hasAnonKey: !!anonKey,
    anonKeyLength: anonKey?.length ?? 0,
    allSupabaseRelatedEnvKeys: envKeysWithSupabase,
  });
}
