import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Modo mantenimiento: mientras la plataforma esta en construccion, ningun
// visitante (ni la landing publica ni el sistema logueado) debe poder verla
// salvo el propietario. El interruptor vive en la tabla platform_config
// (lectura publica via RLS, ver migracion supabase/migrations/2026-10-11-platform-config.sql)
// en vez de una variable de entorno de Vercel, para que Javiel pueda
// apagarlo desde el Panel del Propietario (/api/admin/maintenance) sin
// esperar un redeploy.
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

// Rutas que SIEMPRE deben quedar alcanzables aunque el modo mantenimiento
// este activo: la pagina de mantenimiento misma (evita un loop de rewrite),
// login y el callback de autenticacion (el propietario necesita poder
// iniciar sesion para que se le reconozca como tal) y las rutas de API
// (evita romper las llamadas que esas mismas paginas hacen).
const ALWAYS_ALLOWED_PREFIXES = ["/mantenimiento", "/login", "/auth", "/api"];

function isAlwaysAllowed(pathname: string): boolean {
  return ALWAYS_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function checkMaintenanceGate(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  if (isAlwaysAllowed(pathname)) return null;

  // Fail-closed deliberado: si no se puede confirmar el estado (red,
  // Supabase pausado, etc.), se asume que la plataforma sigue en
  // construccion -- es la lectura mas segura del pedido de Javiel de que
  // "no se vea en la nube" mientras no se confirme lo contrario.
  let maintenanceOn = true;
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL +
        "/rest/v1/platform_config?select=maintenance_mode&id=eq.default",
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: "Bearer " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        maintenanceOn = !!rows[0].maintenance_mode;
      }
    }
  } catch {
    // mantiene maintenanceOn = true (fail-closed)
  }

  if (!maintenanceOn) return null;

  // Aun en mantenimiento, el propietario de la plataforma debe poder ver y
  // probar el sitio real -- se verifica su sesion antes de bloquear a
  // cualquiera.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Solo lectura en esta verificacion -- no se reescriben cookies
            // aqui, eso lo maneja updateSession() para las rutas que si
            // pasan el gate.
          },
        },
      }
    );
    const { data: userData } = await supabase.auth.getUser();
    const isOwner =
      userData?.user?.id === PLATFORM_OWNER_ID ||
      userData?.user?.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;
    if (isOwner) return null;
  } catch {
    // si falla la verificacion de sesion, se trata como visitante no-propietario
  }

  const url = request.nextUrl.clone();
  url.pathname = "/mantenimiento";
  return NextResponse.rewrite(url);
}