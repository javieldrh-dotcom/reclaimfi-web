import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function hasPermission(supabase: any, userId: string, permissionName: string) {
  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = (assignments ?? []).map((a: any) => a.role_id);
  if (roleIds.length === 0) return false;

  const { data: rolePerms } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .in("role_id", roleIds);

  const permIds = (rolePerms ?? []).map((p: any) => p.permission_id);
  if (permIds.length === 0) return false;

  const { data: perms } = await supabase
    .from("permissions")
    .select("name")
    .in("id", permIds);

  const names = (perms ?? []).map((p: any) => p.name);
  return names.includes(permissionName);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedRoutes = ["/dashboard", "/accounting", "/admin", "/reports", "/select-module"];
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && path.startsWith("/accounting")) {
    const allowed = await hasPermission(supabase, user.id, "VIEW_ACCOUNTING");
    if (!allowed) {
      const denyUrl = request.nextUrl.clone();
      denyUrl.pathname = "/select-module";
      return NextResponse.redirect(denyUrl);
    }
  }

  if (user && path.startsWith("/dashboard")) {
    const allowed = await hasPermission(supabase, user.id, "VIEW_RECLAIMFI");
    if (!allowed) {
      const denyUrl = request.nextUrl.clone();
      denyUrl.pathname = "/select-module";
      return NextResponse.redirect(denyUrl);
    }
  }

  return supabaseResponse;
}