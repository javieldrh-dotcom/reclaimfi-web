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

    return NextResponse.json({
      success: true,
      totalCompanies: allCompanies.length,
      totalUsers: totalUsers ?? 0,
      totalCases: totalCases ?? 0,
      activeApiKeys: activeApiKeys ?? 0,
      planBreakdown,
      recentCompanies: allCompanies.slice(0, 5),
    });
  } catch (error: any) {
    console.error("PLATFORM STATS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}