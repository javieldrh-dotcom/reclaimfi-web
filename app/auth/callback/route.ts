import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitRedirect = searchParams.get("redirectTo");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      if (explicitRedirect) {
        return NextResponse.redirect(`${origin}${explicitRedirect}`);
      }

      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("role_id")
        .eq("user_id", data.user.id);

      const roleIds = (assignments ?? []).map((a: any) => a.role_id);

      if (roleIds.length === 0) {
        return NextResponse.redirect(`${origin}/subscribe`);
      }

      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permissions(name)")
        .in("role_id", roleIds);

      const permNames = (rolePerms ?? []).map((p: any) => p.permissions?.name).filter(Boolean);
      const hasReclaimFi = permNames.includes("VIEW_RECLAIMFI");
      const hasAccounting = permNames.includes("VIEW_ACCOUNTING");
      const hasApu = permNames.includes("VIEW_APU");
      const moduleCount = [hasReclaimFi, hasAccounting, hasApu].filter(Boolean).length;

      if (moduleCount === 0) {
        return NextResponse.redirect(`${origin}/subscribe`);
      }
      if (moduleCount > 1) {
        return NextResponse.redirect(`${origin}/select-module`);
      }
      if (hasReclaimFi) return NextResponse.redirect(`${origin}/dashboard`);
      if (hasAccounting) return NextResponse.redirect(`${origin}/accounting`);
      if (hasApu) return NextResponse.redirect(`${origin}/apu/projects`);

      return NextResponse.redirect(`${origin}/select-module`);
    }
    console.error("[AUTH CALLBACK ERROR]", error);
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}