import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Falta la clave de API (header x-api-key)." }, { status: 401 });
    }

    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const supabase = await createClient();

    const { data: keyRecord } = await supabase.from("external_api_keys").select("id, partner_name, is_active").eq("key_hash", keyHash).maybeSingle();

    if (!keyRecord || !keyRecord.is_active) {
      return NextResponse.json({ success: false, error: "Clave de API invalida o inactiva." }, { status: 403 });
    }

    await supabase.from("external_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const { data: signals } = await supabase
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