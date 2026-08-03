import { NextResponse } from "next/server";
import { suggestApuInputs } from "@/app/core/agents/apuSuggestionAgent";
import { createClient } from "@/app/lib/supabase/server";
export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient();
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado. Debes iniciar sesion para usar este servicio." }, { status: 401 });
    }
    const { description, categoryHint } = await request.json();
    const result = await suggestApuInputs(description, categoryHint);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
