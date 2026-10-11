import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Registra una visita de pagina para el control de trafico del Panel del
// Propietario (/admin). Es "best-effort" y deliberadamente publica (sin
// requerir sesion): tiene que poder registrar visitas de alguien que
// todavia no inicio sesion (landing, /login, /subscribe), igual que
// cualquier analitica de trafico real.
//
// Escribe con service_role porque page_visits no tiene ninguna politica
// RLS (ver 2026-10-11-page-visits.sql) -- es deliberado, para que nadie
// pueda leer ni escribir esta tabla directamente con las llaves
// anon/authenticated, solo a traves de esta ruta y de
// app/api/admin/platform-stats/route.ts.
//
// Rate limiting: al ser una ruta publica sin sesion, es un objetivo facil
// para un script que la bombardee (inflar metricas de trafico o saturar
// la tabla). Se limita con dos ventanas deslizantes de 60 segundos,
// contadas sobre la propia tabla page_visits (sin agregar Redis ni otra
// infraestructura):
//   - por visitor_id: hasta 1 escritura por segundo en promedio. Generoso
//     para navegacion normal (el tracker solo dispara por cambio de ruta),
//     pero corta un bucle/script que reusa el mismo visitor_id.
//   - por IP: un limite mas alto, porque varias personas detras del mismo
//     NAT/oficina comparten IP y no deben bloquearse entre si.
// Si se excede cualquiera de los dos, se responde 429 sin insertar; el
// tracker del cliente ya ignora errores de esta ruta (best-effort), asi
// que esto nunca afecta la navegacion del visitante real.
const VISITOR_WINDOW_MS = 60_000;
const VISITOR_MAX_PER_WINDOW = 60;
const IP_WINDOW_MS = 60_000;
const IP_MAX_PER_WINDOW = 300;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  try {
    const { path, visitor_id, referrer } = await request.json().catch(() => ({} as any));

    if (!path || typeof path !== "string" || !visitor_id || typeof visitor_id !== "string" || !UUID_RE.test(visitor_id)) {
      return NextResponse.json({ success: false, error: "path y visitor_id (UUID) son requeridos." }, { status: 400 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ip = getClientIp(request);

    const [{ count: visitorCount }, ipCountResult] = await Promise.all([
      serviceClient
        .from("page_visits")
        .select("*", { count: "exact", head: true })
        .eq("visitor_id", visitor_id)
        .gte("created_at", new Date(Date.now() - VISITOR_WINDOW_MS).toISOString()),
      ip
        ? serviceClient
            .from("page_visits")
            .select("*", { count: "exact", head: true })
            .eq("ip_address", ip)
            .gte("created_at", new Date(Date.now() - IP_WINDOW_MS).toISOString())
        : Promise.resolve({ count: 0 } as any),
    ]);

    if ((visitorCount ?? 0) >= VISITOR_MAX_PER_WINDOW || ((ipCountResult?.count ?? 0) >= IP_MAX_PER_WINDOW)) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes." }, { status: 429 });
    }

    // Usuario autenticado si lo hay (no es requerido). No se usa para
    // autorizar nada, solo para poder correlacionar visitas con una
    // cuenta cuando existe sesion.
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await serviceClient.from("page_visits").insert([{
      path: path.slice(0, 500),
      visitor_id,
      user_id: userData?.user?.id ?? null,
      referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      ip_address: ip,
    }]);

    if (error) {
      console.error("[TRACK-VISIT ERROR]", error);
      return NextResponse.json({ success: false, error: "No se pudo registrar la visita." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TRACK-VISIT ERROR]", err);
    return NextResponse.json({ success: false, error: "No se pudo registrar la visita." }, { status: 500 });
  }
}