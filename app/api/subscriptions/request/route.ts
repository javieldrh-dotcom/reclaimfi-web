import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

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

// Crea (si hace falta) la empresa del usuario y registra una solicitud de
// suscripcion. IMPORTANTE: esta ruta es la UNICA forma valida de crear una
// fila en `subscriptions`. El estado SIEMPRE se fija aqui, en el servidor,
// como PENDING_PAYMENT — nunca se acepta un estado enviado por el cliente.
// Activar una suscripcion (ACTIVE) requiere una confirmacion explicita de un
// administrador (ver /admin/subscriptions) o, para PayPal, una verificacion
// server-to-server contra la API de PayPal (ver /api/subscriptions/paypal-confirm).
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado. Debes iniciar sesion para usar este servicio." }, { status: 401 });
    }
    const user = userData.user;

    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "subscriptions-request", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const body = await request.json();
    const planId: string | undefined = body?.planId;
    const paymentMethodId: string | undefined = body?.paymentMethodId;
    const receiptUrl: string | null = typeof body?.receiptUrl === "string" ? body.receiptUrl : null;
    const industrySector: string = VALID_SECTORS.includes(body?.industrySector) ? body.industrySector : "GENERIC";

    if (!planId || !paymentMethodId) {
      return NextResponse.json({ success: false, error: "Selecciona un plan y un metodo de pago." }, { status: 400 });
    }

    // Validar que el plan y el metodo de pago existen y estan activos.
    const { data: plan } = await supabase.from("subscription_plans").select("id, plan_code").eq("id", planId).single();
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan invalido." }, { status: 400 });
    }
    const { data: method } = await supabase.from("payment_methods").select("id, method_code, is_active").eq("id", paymentMethodId).single();
    if (!method || !method.is_active) {
      return NextResponse.json({ success: false, error: "Metodo de pago invalido." }, { status: 400 });
    }
    // El flujo de PayPal se confirma exclusivamente via /api/subscriptions/paypal-confirm
    // (con verificacion contra la API de PayPal), nunca por esta ruta.
    if (method.method_code === "PAYPAL") {
      return NextResponse.json({ success: false, error: "Las suscripciones de PayPal se confirman automaticamente al aprobar el pago." }, { status: 400 });
    }

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

    // Estado SIEMPRE PENDING_PAYMENT: subir un comprobante no otorga acceso
    // inmediato. Un administrador debe verificarlo y confirmar la suscripcion
    // desde /admin/subscriptions.
    const { data: inserted, error } = await supabase
      .from("subscriptions")
      .insert([{
        company_id: companyId,
        plan_id: planId,
        payment_method_id: paymentMethodId,
        status: "PENDING_PAYMENT",
        receipt_url: receiptUrl,
        approved_at: null,
        expires_at: null,
      }])
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Error: " + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: inserted.id,
      companyId,
      message: receiptUrl
        ? "Solicitud registrada con tu comprobante. Un administrador verificara el pago y activara tu acceso."
        : "Solicitud registrada. Realiza el pago y envia tu comprobante para activar tu acceso.",
    });
  } catch (error: any) {
    console.error("SUBSCRIPTION REQUEST ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
