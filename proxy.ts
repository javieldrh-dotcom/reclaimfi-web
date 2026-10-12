import { type NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/middleware";
import { checkMaintenanceGate } from "@/app/lib/supabase/maintenanceGate";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const publicPageNames = ["", "servicios", "tecnologia", "contacto", "producto", "soluciones", "precios", "seguridad", "privacidad", "terminos"];

function isPublicPage(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return true;
  const maybeLocale = segments[0];
  const isLocalePrefixed = (routing.locales as readonly string[]).includes(maybeLocale);
  const rest = isLocalePrefixed ? segments.slice(1) : segments;
  if (rest.length === 0) return true;
  return publicPageNames.includes(rest[0]);
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Modo mantenimiento: se revisa antes que cualquier otra cosa (landing
  // publica o app logueada) porque mientras la plataforma esta en
  // construccion, ninguna de las dos debe ser visible salvo para el
  // propietario. Ver app/lib/supabase/maintenanceGate.ts.
  const maintenanceResponse = await checkMaintenanceGate(request, pathname);
  if (maintenanceResponse) return maintenanceResponse;

  if (isPublicPage(pathname)) {
    return intlMiddleware(request);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};