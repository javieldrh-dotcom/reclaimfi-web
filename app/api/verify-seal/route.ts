import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { chainHash } = await request.json();
    if (!chainHash) {
      return NextResponse.json({ success: false, error: "Falta el hash a verificar." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_seal_public", { p_chain_hash: chainHash.trim() });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const result = data?.[0];
    return NextResponse.json({
      success: true,
      existsInSystem: result?.exists_in_system ?? false,
      chainValid: result?.chain_valid ?? false,
      sealedAt: result?.sealed_at ?? null,
      positionInChain: result?.position_in_chain ?? null,
      totalChainLength: result?.total_chain_length ?? null,
    });
  } catch (error: any) {
    console.error("VERIFY SEAL ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}