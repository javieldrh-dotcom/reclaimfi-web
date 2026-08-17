import { NextResponse } from "next/server";
import { extractPliegoData } from "@/app/core/agents/pliegoExtractionAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient();
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado. Debes iniciar sesion para usar este servicio." }, { status: 401 });
    }
    const { data: allowed } = await supabaseAuth.rpc("check_rate_limit", { p_endpoint: "extract-pliego", p_max_requests: 5, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento antes de intentar de nuevo (maximo 5 por minuto)." }, { status: 429 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No se recibio ningun archivo." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Solo se permiten archivos PDF." }, { status: 400 });
    }
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ success: false, error: "El PDF es muy grande (maximo 25MB)." }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const result = await extractPliegoData(base64);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("EXTRACT PLIEGO ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}