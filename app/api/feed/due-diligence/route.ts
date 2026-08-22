import { NextResponse } from "next/server";
import crypto from "crypto";
import { performDueDiligence } from "@/app/core/agents/dueDiligenceAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
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

    const { entityName, entityType } = await request.json();
    if (!entityName || !entityType) {
      return NextResponse.json({ success: false, error: "Faltan entityName o entityType." }, { status: 400 });
    }

    // Version externa: SOLO fuentes publicas, sin acceso al historial interno
    // de relacion comercial de ningun cliente de la plataforma (dato confidencial).
    const result = await performDueDiligence(entityName, entityType, {
      transactionCount: 0,
      totalAmount: 0,
      firstTransactionDate: null,
      lastTransactionDate: null,
    });

    return NextResponse.json({
      success: true,
      partner: keyRecord.partner_name,
      entityName,
      riskLevel: result.riskLevel,
      adverseMediaFindings: result.adverseMediaFindings,
      recommendation: result.recommendation,
      sourcesChecked: result.sourcesChecked,
      note: "Analisis basado unicamente en fuentes publicas. No incluye historial de relacion comercial de ningun cliente de ReclaimFi.",
    });
  } catch (error: any) {
    console.error("EXTERNAL DUE DILIGENCE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}