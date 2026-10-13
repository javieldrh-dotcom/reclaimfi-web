import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Esta ruta la consume un socio externo (ej. Chainalysis) que nunca inicia
// sesion con Supabase -- su unica credencial es el header x-api-key. Por
// eso TODO el acceso a datos aqui usa el cliente de servicio
// (service_role), que salta RLS por diseno: no hay sesion de usuario que
// las politicas de RLS puedan evaluar, asi que con el cliente normal esta
// ruta rechazaba SIEMPRE cualquier clave, valida o no (external_api_keys
// no tiene ninguna politica RLS a proposito, ver auditoria de Fase 3). La
// verificacion del hash de la clave + is_active, mas abajo, es la unica
// autorizacion real de esta ruta.
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Falta la clave de API (header x-api-key)." }, { status: 401 });
    }

    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const { data: keyRecord } = await serviceClient.from("external_api_keys").select("id, partner_name, is_active").eq("key_hash", keyHash).maybeSingle();

    if (!keyRecord || !keyRecord.is_active) {
      return NextResponse.json({ success: false, error: "Clave de API invalida o inactiva." }, { status: 403 });
    }

    await serviceClient.from("external_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const { data: signals } = await serviceClient
      .from("arbitrage_signals")
      .select("currency, risk_level, findings_summary, detected_at, companies!inner(share_arbitrage_signals)")
      .eq("companies.share_arbitrage_signals", true)
      .order("detected_at", { ascending: false })
      .limit(100);

    const anonymizedSignals = (signals ?? []).map((s: any) => ({
      currency: s.currency,
      riskLevel: s.risk_level,
      findingsSummary: s.findings_summary,
      detectedAt: s.detected_at,
    }));

    return NextResponse.json({
      success: true,
      partner: keyRecord.partner_name,
      signalCount: anonymizedSignals.length,
      signals: anonymizedSignals,
    });
  } catch (error: any) {
    console.error("ARBITRAGE FEED ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
