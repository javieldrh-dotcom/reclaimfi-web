import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SOLO PARA USO EN SERVIDOR. Usa la service_role key de Supabase, que tiene
// permisos administrativos y SALTA todas las politicas RLS por diseno de
// Supabase. Ningun archivo "use client" (ni nada que termine importado por
// uno) debe importar este modulo, directa ni indirectamente, y la clave
// nunca debe exponerse al navegador.
//
// Se usa exclusivamente para escribir en event_ledger (la cadena de
// custodia forense). Esa tabla tiene el INSERT revocado para el rol
// "authenticated" (ver migracion 2026-10-09-event-ledger-lockdown.sql),
// precisamente para que ningun usuario -ni siquiera un miembro legitimo de
// su propia empresa- pueda fabricar entradas de la cadena desde la consola
// del navegador. Solo este cliente, con la clave de servicio, puede
// escribir ahi.
export function createLedgerServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_URL) en las " +
        "variables de entorno del servidor. Sin esta clave no se puede " +
        "escribir en la cadena de custodia (event_ledger). Consiguela en " +
        "tu panel de Supabase: Settings -> API -> service_role key."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}