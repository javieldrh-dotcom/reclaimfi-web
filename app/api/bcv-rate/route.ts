import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "bcv-rate", p_max_requests: 30, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes de tasa BCV. Espera un momento." }, { status: 429 });
    }

    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "No se pudo consultar la tasa BCV en este momento." }, { status: 502 });
    }
    const data = await res.json();

    return NextResponse.json({
      success: true,
      rate: data.promedio,
      updatedAt: data.fechaActualizacion,
      source: "DolarAPI (oficial BCV)",
    });
  } catch (error: any) {
    console.error("BCV RATE ERROR:", error);
    return NextResponse.json({ success: false, error: "No se pudo consultar la tasa BCV. Ingresa el valor manualmente." }, { status: 500 });
  }
}