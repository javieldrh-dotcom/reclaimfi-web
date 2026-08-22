import { NextResponse } from "next/server";
import { reconcileWithBlockchain } from "@/app/core/agents/reconciliationAgent";
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
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "reconcile-blockchain", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const { companyId, recordDate, recordDescription, recordAmountUsd, walletAddress } = await request.json();
    if (!companyId || !recordDate || !recordAmountUsd || !walletAddress) {
      return NextResponse.json({ success: false, error: "Faltan datos requeridos." }, { status: 400 });
    }

    const { data: membership } = await supabase.from("user_companies").select("id").eq("user_id", userData.user.id).eq("company_id", companyId).maybeSingle();
    if (!membership) {
      return NextResponse.json({ success: false, error: "No tienes acceso a esta empresa." }, { status: 403 });
    }

    if (!isValidBitcoinAddress(walletAddress.trim())) {
      return NextResponse.json({ success: false, error: "Direccion de Bitcoin invalida. Esta herramienta solo soporta Bitcoin por ahora." }, { status: 400 });
    }

    const btcRes = await fetch("https://blockchain.info/rawaddr/" + encodeURIComponent(walletAddress.trim()) + "?limit=50");
    if (!btcRes.ok) {
      return NextResponse.json({ success: false, error: "No se pudo consultar la blockchain en este momento." }, { status: 502 });
    }
    const btcData = await btcRes.json();

    const recordDateMs = new Date(recordDate).getTime();
    const WINDOW_DAYS = 7;
    const DAY_MS = 24 * 60 * 60 * 1000;

    const nearbyTransactions = (btcData.txs || [])
      .map((tx: any) => {
        const received = (tx.out || []).filter((o: any) => o.addr === walletAddress.trim()).reduce((s: number, o: any) => s + (o.value || 0), 0);
        const sent = (tx.inputs || []).filter((i: any) => i.prev_out?.addr === walletAddress.trim()).reduce((s: number, i: any) => s + (i.prev_out?.value || 0), 0);
        const direction = received >= sent ? "IN" : "OUT";
        const valueBtc = (direction === "IN" ? received : sent) / 100000000;
        const txDateMs = (tx.time || 0) * 1000;
        return {
          date: new Date(txDateMs).toISOString().slice(0, 10),
          valueBtc,
          direction,
          diffDays: Math.abs(txDateMs - recordDateMs) / DAY_MS,
        };
      })
      .filter((t: any) => t.diffDays <= WINDOW_DAYS)
      .sort((a: any, b: any) => a.diffDays - b.diffDays);

    const currentBtcPriceRes = await fetch("https://blockchain.info/ticker");
    let btcUsdRate = 0;
    if (currentBtcPriceRes.ok) {
      const priceData = await currentBtcPriceRes.json();
      btcUsdRate = priceData?.USD?.last || 0;
    }

    const result = await reconcileWithBlockchain(
      { date: recordDate, description: recordDescription || "", amountUsd: recordAmountUsd },
      walletAddress.trim(),
      btcUsdRate,
      nearbyTransactions.map((t: any) => ({ date: t.date, valueBtc: t.valueBtc, direction: t.direction }))
    );

    return NextResponse.json({ success: true, result, nearbyTransactions, btcUsdRate });
  } catch (error: any) {
    console.error("RECONCILE BLOCKCHAIN ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}