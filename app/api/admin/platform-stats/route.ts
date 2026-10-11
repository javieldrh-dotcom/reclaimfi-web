import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();

    const isOwner =
      userData?.user?.id === PLATFORM_OWNER_ID ||
      userData?.user?.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;

    if (!isOwner) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: companies } = await serviceClient.from("companies").select("id, name, subscription_plan, created_at").order("created_at", { ascending: false });
    const allCompanies = companies ?? [];

    const planBreakdown: Record<string, number> = {};
    allCompanies.forEach((c: any) => {
      const plan = c.subscription_plan || "SIN PLAN";
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    });

    const { count: totalUsers } = await serviceClient.from("user_companies").select("*", { count: "exact", head: true });
    const { count: totalCases } = await serviceClient.from("cases").select("*", { count: "exact", head: true });
    const { count: activeApiKeys } = await serviceClient.from("external_api_keys").select("*", { count: "exact", head: true }).eq("is_active", true);

    // Suscripciones activas/vencidas: misma definicion que
    // app/admin/subscriptions/page.tsx (isExpired) -- "activa" es
    // status=ACTIVE con expires_at nulo o en el futuro; "vencida" es
    // status=ACTIVE con expires_at ya pasado. CANCELLED/PENDING_PAYMENT no
    // cuentan en ninguna de las dos, igual que en esa pagina.
    const nowIso = new Date().toISOString();
    const { count: activeSubscriptions } = await serviceClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .or("expires_at.is.null,expires_at.gte." + nowIso);
    const { count: expiredSubscriptions } = await serviceClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .lt("expires_at", nowIso);

    // Control de visitas (page_visits, ver migracion
    // 2026-10-11-page-visits.sql). Esta tabla no tiene politicas RLS a
    // proposito -- solo se lee aqui con service_role.
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: visits24h } = await serviceClient.from("page_visits").select("*", { count: "exact", head: true }).gte("created_at", dayAgo);
    const { count: visits7d } = await serviceClient.from("page_visits").select("*", { count: "exact", head: true }).gte("created_at", weekAgo);
    const { count: visits30d } = await serviceClient.from("page_visits").select("*", { count: "exact", head: true }).gte("created_at", monthAgo);
    const { count: visitsTotal } = await serviceClient.from("page_visits").select("*", { count: "exact", head: true });

    // Visitantes unicos y paginas mas visitadas de los ultimos 7 dias: se
    // agregan en memoria sobre una muestra acotada (hasta 10,000 filas) en
    // vez de con una funcion SQL de agregacion -- suficiente para el
    // volumen de trafico actual de la plataforma. Si el trafico crece
    // mucho, esto deberia pasar a una vista materializada o una funcion
    // RPC de Postgres.
    const { data: recentVisits } = await serviceClient
      .from("page_visits")
      .select("path, visitor_id")
      .gte("created_at", weekAgo)
      .limit(10000);

    const uniqueVisitorIds = new Set((recentVisits ?? []).map((v: any) => v.visitor_id));
    const pathCounts: Record<string, number> = {};
    (recentVisits ?? []).forEach((v: any) => {
      pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
    });
    const topPages = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, count }));

    return NextResponse.json({
      success: true,
      totalCompanies: allCompanies.length,
      totalUsers: totalUsers ?? 0,
      totalCases: totalCases ?? 0,
      activeApiKeys: activeApiKeys ?? 0,
      planBreakdown,
      recentCompanies: allCompanies.slice(0, 5),
      subscriptions: {
        active: activeSubscriptions ?? 0,
        expired: expiredSubscriptions ?? 0,
      },
      visits: {
        last24h: visits24h ?? 0,
        last7d: visits7d ?? 0,
        last30d: visits30d ?? 0,
        total: visitsTotal ?? 0,
        uniqueVisitors7d: uniqueVisitorIds.size,
        topPages7d: topPages,
      },
    });
  } catch (error: any) {
    console.error("PLATFORM STATS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}