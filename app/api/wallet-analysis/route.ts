import { NextResponse } from "next/server";
import { analyzeWalletData } from "@/app/core/agents/walletAnalysisAgent";
import { createClient } from "@/app/lib/supabase/server";

function isValidBitcoinAddress(address: string): boolean {
  return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "wallet-analysis", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const { address } = await request.json();
    if (!address || typeof address !== "string") {
      return NextResponse.json({ success: false, error: "Falta la direccion de wallet." }, { status: 400 });
    }

    if (!isValidBitcoinAddress(address.trim())) {
      return NextResponse.json({ success: false, error: "Esta herramienta actualmente solo soporta direcciones de Bitcoin (empiezan con 1, 3, o bc1). Soporte para otras redes proximamente." }, { status: 400 });
    }

    const btcRes = await fetch("https://blockchain.info/rawaddr/" + encodeURIComponent(address.trim()) + "?limit=10");
    if (!btcRes.ok) {
      if (btcRes.status === 404) {
        return NextResponse.json({ success: false, error: "No se encontraron transacciones para esta direccion. Verifica que sea correcta." }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: "No se pudo consultar la blockchain en este momento. Intenta de nuevo." }, { status: 502 });
    }
    const btcData = await btcRes.json();

    const balanceBtc = (btcData.final_balance || 0) / 100000000;
    const totalReceivedBtc = (btcData.total_received || 0) / 100000000;
    const totalSentBtc = (btcData.total_sent || 0) / 100000000;
    const txCount = btcData.n_tx || 0;

    const recentTransactions = (btcData.txs || []).slice(0, 8).map((tx: any) => {
      const received = (tx.out || []).filter((o: any) => o.addr === address.trim()).reduce((s: number, o: any) => s + (o.value || 0), 0);
      const sent = (tx.inputs || []).filter((i: any) => i.prev_out?.addr === address.trim()).reduce((s: number, i: any) => s + (i.prev_out?.value || 0), 0);
      const direction = received >= sent ? "IN" : "OUT";
      const valueBtc = (direction === "IN" ? received : sent) / 100000000;
      return {
        timestamp: new Date((tx.time || 0) * 1000).toISOString().slice(0, 10),
        valueBtc,
        direction,
      };
    });

    const { data: ofacMatch } = await supabase.from("ofac_sanctioned_addresses").select("*").eq("address", address.trim()).maybeSingle();

    const analysis = await analyzeWalletData(address.trim(), balanceBtc, txCount, totalReceivedBtc, totalSentBtc, recentTransactions);

    if (ofacMatch) {
      analysis.riskLevel = "HIGH";
      analysis.reasons = ["DIRECCION ENCONTRADA EN LA LISTA OFICIAL DE SANCIONES OFAC (SDN List) del Departamento del Tesoro de EE.UU.", ...analysis.reasons];
      analysis.recommendation = "ALERTA: Esta direccion esta sancionada oficialmente por OFAC. Cualquier transaccion con esta wallet puede constituir una violacion de sanciones internacionales. Consulta con un especialista en cumplimiento antes de proceder.";
    }

    return NextResponse.json({
      success: true,
      address: address.trim(),
      balanceBtc,
      txCount,
      totalReceivedBtc,
      totalSentBtc,
      recentTransactions,
      analysis,
      ofacSanctioned: !!ofacMatch,
    });
  } catch (error: any) {
    console.error("WALLET ANALYSIS ERROR:", error);
    return NextResponse.json({ success: false, error: "No se pudo completar el analisis: " + error.message }, { status: 500 });
  }
}