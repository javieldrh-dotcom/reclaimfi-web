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
// Limitacion conocida: no hay rate limiting. Para una plataforma B2B de
// bajo volumen como esta, el riesgo de abuso es bajo, pero si el trafico
// publico crece valdria la pena agregar un limite por IP/visitor_id.
export async function POST(request: Request) {
  try {
    const { path, visitor_id, referrer } = await request.json().catch(() => ({} as any));

    if (!path || typeof path !== "string" || !visitor_id || typeof visitor_id !== "string") {
      return NextResponse.json({ success: false, error: "path y visitor_id son requeridos." }, { status: 400 });
    }

    // Usuario autenticado si lo hay (no es requerido). No se usa para
    // autorizar nada, solo para poder correlacionar visitas con una
    // cuenta cuando existe sesion.
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await serviceClient.from("page_visits").insert([{
      path: path.slice(0, 500),
      visitor_id,
      user_id: userData?.user?.id ?? null,
      referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
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
