import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

// Base de la API REST de PayPal. Usa sandbox si PAYPAL_ENV=sandbox.
const PAYPAL_API_BASE = process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal no esta configurado en el servidor (faltan credenciales).");
  }
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudo autenticar con PayPal.");
  }
  const data = await res.json();
  return data.access_token;
}

// Confirma una suscripcion de PayPal DESPUES de verificarla directamente
// contra la API de PayPal (server-to-server). El front-end solo envia el
// subscriptionID que PayPal le devuelve en onApprove; ese ID nunca se confia
// a ciegas, ni el front-end puede fijar el estado de la suscripcion.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado. Debes iniciar sesion para usar este servicio." }, { status: 401 });
    }
    const user = userData.user;

    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "subscriptions-paypal-confirm", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const body = await request.json();
    const paypalSubscriptionId: string | undefined = body?.paypalSubscriptionId;
    const planId: string | undefined = body?.planId;
    const industrySector: string = typeof body?.industrySector === "string" ? body.industrySector : "GENERIC";
    if (!paypalSubscriptionId || !planId) {
      return NextResponse.json({ success: false, error: "Falta el ID de suscripcion de PayPal o el plan." }, { status: 400 });
    }

    const { data: plan } = await supabase.from("subscription_plans").select("id, plan_code, paypal_plan_id").eq("id", planId).single();
    if (!plan || !plan.paypal_plan_id) {
      return NextResponse.json({ success: false, error: "Plan invalido para PayPal." }, { status: 400 });
    }

    const { data: paypalMethod } = await supabase.from("payment_methods").select("id").eq("method_code", "PAYPAL").eq("is_active", true).single();
    if (!paypalMethod) {
      return NextResponse.json({ success: false, error: "Metodo de pago PayPal no disponible." }, { status: 400 });
    }

    // Verificacion real contra PayPal: nunca confiamos en lo que dice el cliente.
    const accessToken = await getPayPalAccessToken();
    const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(paypalSubscriptionId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!verifyRes.ok) {
      return NextResponse.json({ success: false, error: "No se pudo verificar la suscripcion con PayPal." }, { status: 502 });
    }
    const paypalSub = await verifyRes.json();

    if (paypalSub.plan_id !== plan.paypal_plan_id) {
      return NextResponse.json({ success: false, error: "La suscripcion de PayPal no corresponde al plan seleccionado." }, { status: 400 });
    }
    if (paypalSub.status !== "ACTIVE") {
      return NextResponse.json({ success: false, error: `PayPal reporta el estado "${paypalSub.status}", no ACTIVE. No se activo el acceso.` }, { status: 400 });
    }

    // Resolver / crear la empresa del usuario (misma logica que el flujo manual).
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
      await supabase.from("user_companies").insert([{ user_id: user.id, company_id: newCompany.id }]);

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

    const nextBilling = paypalSub.billing_info?.next_billing_time ? new Date(paypalSub.billing_info.next_billing_time) : null;

    const subscriptionRow: Record<string, any> = {
      company_id: companyId,
      plan_id: planId,
      payment_method_id: paypalMethod.id,
      status: "ACTIVE",
      approved_at: new Date().toISOString(),
      expires_at: nextBilling ? nextBilling.toISOString().slice(0, 10) : null,
    };

    // Intentamos guardar el ID de suscripcion de PayPal para trazabilidad y
    // para poder reconciliar renovaciones/cancelaciones mas adelante. Si la
    // columna no existe todavia en la base de datos, reintentamos sin ella
    // en lugar de fallar toda la activacion.
    let insertResult = await supabase
      .from("subscriptions")
      .insert([{ ...subscriptionRow, paypal_subscription_id: paypalSubscriptionId }])
      .select("id")
      .single();

    if (insertResult.error && insertResult.error.code === "42703") {
      insertResult = await supabase.from("subscriptions").insert([subscriptionRow]).select("id").single();
    }

    if (insertResult.error) {
      return NextResponse.json({ success: false, error: "Error al registrar la suscripcion: " + insertResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: insertResult.data.id,
      companyId,
      message: "Suscripcion de PayPal verificada y activada correctamente.",
    });
  } catch (error: any) {
    console.error("PAYPAL CONFIRM ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
