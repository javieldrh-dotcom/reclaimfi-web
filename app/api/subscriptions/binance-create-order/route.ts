import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { grantCompanyAdmin } from "@/app/lib/grantCompanyAdmin";
import { createBinanceOrder } from "@/app/lib/binancePay";

const VALID_SECTORS = [
  "GENERIC",
  "RETAIL",
  "RESTAURANT",
  "CONSTRUCTION",
  "MANUFACTURING",
  "PROFESSIONAL_SERVICES",
  "AGRICULTURE",
  "CUSTOMS_TRADE",
];

// Crea una orden de cobro de Binance Pay para activacion AUTOMATICA de la
// suscripcion (segundo metodo de pago internacional con activacion
// instantanea, junto a PayPal). A diferencia de PayPal -- que tiene un
// boton de SDK que confirma la aprobacion en el navegador-- Binance Pay
// es un checkout alojado por Binance: el usuario es redirigido a
// `checkoutUrl`, paga alla, y Binance nos avisa por un webhook aparte
// (ver /api/subscriptions/binance-webhook). Por eso la empresa + el rol
// ADMIN se otorgan AQUI, antes del pago -- exactamente el mismo momento
// en que ya se otorgan hoy en el flujo manual (/api/subscriptions/request):
// la fila en `subscriptions` nace en PENDING_PAYMENT y es el webhook quien
// la pasa a ACTIVE. El webhook nunca tiene sesion de usuario (es Binance
// llamando al servidor), asi que no puede crear la empresa ni asignar el
// rol por si mismo -- debe quedar hecho desde este lado.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado. Debes iniciar sesion para usar este servicio." }, { status: 401 });
    }
    const user = userData.user;

    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "subscriptions-binance-create-order", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const body = await request.json();
    const planId: string | undefined = body?.planId;
    const industrySector: string = VALID_SECTORS.includes(body?.industrySector) ? body.industrySector : "GENERIC";
    if (!planId) {
      return NextResponse.json({ success: false, error: "Selecciona un plan." }, { status: 400 });
    }

    const { data: plan } = await supabase.from("subscription_plans").select("id, plan_code, plan_name, monthly_price_usd").eq("id", planId).single();
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan invalido." }, { status: 400 });
    }

    const { data: binanceMethod } = await supabase.from("payment_methods").select("id").eq("method_code", "BINANCE_PAY").eq("is_active", true).single();
    if (!binanceMethod) {
      return NextResponse.json({ success: false, error: "Metodo de pago Binance Pay no disponible." }, { status: 400 });
    }

    // Resolver / crear la empresa del usuario (mismo patron que
    // /api/subscriptions/request y /api/subscriptions/paypal-confirm).
    let companyId: string | null = null;
    const { data: uc } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .order("last_active_at", { ascending: false })
      .limit(1)
      .single();
    companyId = uc?.company_id ?? null;

    if (!companyId) {
      const { data: newCompanyRows, error: companyError } = await supabase
        .from("companies")
        .insert([{ name: "Mi Empresa", owner_id: user.id, industry_sector: industrySector, country: "VE", functional_currency: "USD" }])
        .select("id");
      if (companyError || !newCompanyRows || newCompanyRows.length === 0) {
        return NextResponse.json({ success: false, error: "Error al crear tu empresa: " + companyError?.message }, { status: 500 });
      }
      const newCompany = newCompanyRows[0];
      const membership = await grantCompanyAdmin(supabase, user.id, newCompany.id);
      if (!membership.success) {
        return NextResponse.json({ success: false, error: "Empresa creada pero no se pudo configurar tu acceso: " + membership.error }, { status: 500 });
      }

      const { data: baseAccounts } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, account_type, sector")
        .eq("company_id", "32dcf25d-12e4-45f5-9de0-9dfef2c54bef")
        .in("sector", ["GENERIC", industrySector]);
      if (baseAccounts && baseAccounts.length > 0) {
        const newAccounts = baseAccounts.map((a: any) => ({ ...a, company_id: newCompany.id }));
        await supabase.from("chart_of_accounts").insert(newAccounts);
      }
      companyId = newCompany.id;
    }

    // La fila PENDING_PAYMENT se crea primero (sin binance_merchant_trade_no
    // todavia) para obtener un id propio: ese id (sin guiones, 32 caracteres
    // hex) es el merchantTradeNo que se le pasa a Binance -- unico por
    // construccion, y el limite de Binance es exactamente 32 caracteres.
    const { data: pendingSub, error: pendingError } = await supabase
      .from("subscriptions")
      .insert([{
        company_id: companyId,
        plan_id: planId,
        payment_method_id: binanceMethod.id,
        status: "PENDING_PAYMENT",
        approved_at: null,
        expires_at: null,
      }])
      .select("id")
      .single();
    if (pendingError || !pendingSub) {
      return NextResponse.json({ success: false, error: "Error al registrar la solicitud: " + pendingError?.message }, { status: 500 });
    }

    const merchantTradeNo = String(pendingSub.id).replace(/-/g, "");
    const origin = new URL(request.url).origin;

    let order;
    try {
      order = await createBinanceOrder({
        merchantTradeNo,
        fiatAmount: plan.monthly_price_usd,
        fiatCurrency: "USD",
        goodsName: "ReclaimFi - " + plan.plan_name,
        returnUrl: origin + "/subscribe?binance_return=1",
        cancelUrl: origin + "/subscribe?binance_cancel=1",
        webhookUrl: origin + "/api/subscriptions/binance-webhook",
      });
    } catch (orderError: any) {
      // La fila PENDING_PAYMENT ya quedo creada; se deja asi (igual que una
      // solicitud manual nunca pagada) y se informa el error para que el
      // usuario pueda reintentar.
      return NextResponse.json({ success: false, error: "No se pudo crear la orden en Binance Pay: " + orderError.message }, { status: 502 });
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ binance_merchant_trade_no: merchantTradeNo })
      .eq("id", pendingSub.id);
    if (updateError) {
      // La orden ya se creo en Binance -- si no logramos guardar el
      // merchantTradeNo, el webhook de confirmacion no podra encontrar
      // esta fila mas tarde. Se avisa explicitamente en vez de devolver
      // un checkoutUrl que luego "nunca activa" nada.
      return NextResponse.json({ success: false, error: "La orden se creo en Binance pero no se pudo vincular a tu suscripcion: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      companyId,
      checkoutUrl: order.checkoutUrl,
      universalUrl: order.universalUrl,
      deeplink: order.deeplink,
      qrcodeLink: order.qrcodeLink,
      merchantTradeNo,
    });
  } catch (error: any) {
    console.error("BINANCE CREATE ORDER ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}