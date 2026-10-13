import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

// Confirma el cobro de una factura de Cuentas por Cobrar pagada por el
// cliente via PayPal (orden de pago unico, no suscripcion -- ver
// /api/subscriptions/paypal-confirm para el flujo de suscripciones, que es
// parecido pero no reutilizable aqui porque alla se verifica un
// subscriptionID y aqui un orderID).
//
// Igual que el flujo de suscripciones: el front-end solo envia el
// orderID que PayPal le devuelve tras el pago; este ID se verifica
// siempre server-to-server contra la API de PayPal antes de tocar la
// base de datos. Usa el cliente de sesion (no service_role) para que las
// politicas RLS normales de journal_entries/journal_lines/ar_invoices
// sigan aplicando -- solo un ADMIN/CONTADOR de la empresa de la factura
// puede confirmar su cobro.
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
  if (!res.ok) throw new Error("No se pudo autenticar con PayPal.");
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    // Mismo limite que su hermano /api/subscriptions/paypal-confirm: cada
    // llamada verifica contra la API real de PayPal, asi que sin este
    // limite un loop del cliente (o un reintento automatico mal escrito)
    // podria agotar la cuota de la cuenta de PayPal. Esta ruta se habia
    // quedado sin el, a diferencia de su hermano -- se corrige aqui.
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "ar-invoices-paypal-confirm", p_max_requests: 10, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({} as any));
    const invoiceId: string | undefined = body?.invoiceId;
    const paypalOrderId: string | undefined = body?.paypalOrderId;
    const paymentAccountId: string | undefined = body?.paymentAccountId;
    if (!invoiceId || !paypalOrderId || !paymentAccountId) {
      return NextResponse.json({ success: false, error: "Faltan datos (factura, orden de PayPal o cuenta de cobro)." }, { status: 400 });
    }

    // RLS limita esta consulta a facturas de empresas donde el usuario es
    // miembro -- no hace falta un chequeo de pertenencia manual aparte.
    const { data: invoice, error: invoiceError } = await supabase.from("ar_invoices").select("*").eq("id", invoiceId).single();
    if (invoiceError || !invoice) {
      return NextResponse.json({ success: false, error: "Factura no encontrada." }, { status: 404 });
    }
    if (invoice.status !== "PENDING" && invoice.status !== "OVERDUE") {
      return NextResponse.json({ success: false, error: `La factura ya esta en estado "${invoice.status}", no se puede cobrar de nuevo.` }, { status: 400 });
    }

    // Verificacion real contra PayPal: nunca se confia en lo que dice el cliente.
    const accessToken = await getPayPalAccessToken();
    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!orderRes.ok) {
      return NextResponse.json({ success: false, error: "No se pudo verificar la orden con PayPal." }, { status: 502 });
    }
    const order = await orderRes.json();

    if (order.status !== "COMPLETED") {
      return NextResponse.json({ success: false, error: `PayPal reporta el estado "${order.status}", no COMPLETED. No se registro el cobro.` }, { status: 400 });
    }

    const purchaseUnit = order.purchase_units?.[0];
    const capturedAmount = purchaseUnit?.payments?.captures?.[0]?.amount;
    const paidValue = capturedAmount ? parseFloat(capturedAmount.value) : NaN;
    const paidCurrency = capturedAmount?.currency_code;

    if (paidCurrency !== "USD") {
      return NextResponse.json({ success: false, error: "La orden de PayPal no esta en USD." }, { status: 400 });
    }
    // Tolerancia de 1 centavo por redondeo, igual que el resto del sistema
    // (ver patrones similares de comparacion de montos en reconciliacion).
    if (isNaN(paidValue) || Math.abs(paidValue - invoice.amount) > 0.01) {
      return NextResponse.json({ success: false, error: `El monto capturado por PayPal (${capturedAmount?.value ?? "desconocido"}) no coincide con el monto de la factura (${invoice.amount}).` }, { status: 400 });
    }

    // El asiento de cobro debe acreditar la MISMA cuenta de Cuentas por
    // Cobrar que se debito al crear la factura (no una generica), para que
    // esa cuenta especifica vuelva a cero. Se obtiene del asiento original
    // en vez de asumir una cuenta fija.
    const { data: originalLines } = await supabase.from("journal_lines").select("account_id, debit").eq("journal_entry_id", invoice.journal_entry_id).gt("debit", 0);
    const arAccountId = originalLines?.[0]?.account_id;
    if (!arAccountId) {
      return NextResponse.json({ success: false, error: "No se pudo determinar la cuenta de Cuentas por Cobrar original de esta factura." }, { status: 500 });
    }

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", invoice.company_id).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;
    const today = new Date().toISOString().slice(0, 10);

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: invoice.company_id,
      description: "Cobro via PayPal - Factura " + invoice.invoice_number + " - " + invoice.customer_name,
      entry_date: today,
      entry_number: nextNumber,
    }]).select("id").single();
    if (entryError || !entry) {
      return NextResponse.json({ success: false, error: "No se pudo crear el asiento de cobro: " + entryError?.message }, { status: 500 });
    }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: paymentAccountId, debit: invoice.amount, credit: 0 },
      { journal_entry_id: entry.id, account_id: arAccountId, debit: 0, credit: invoice.amount },
    ]);
    if (linesError) {
      return NextResponse.json({ success: false, error: "El asiento se creo pero no se pudieron guardar sus lineas: " + linesError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase.from("ar_invoices").update({
      status: "PAID",
      paid_amount: paidValue,
      paid_at: new Date().toISOString(),
      payment_method: "PAYPAL",
      paypal_order_id: paypalOrderId,
      payment_account_id: paymentAccountId,
    }).eq("id", invoiceId);

    if (updateError) {
      // El indice unico de paypal_order_id puede disparar aqui si esta
      // misma orden ya se uso para otra factura (carrera entre pestañas,
      // doble click, etc.) -- el asiento de cobro ya se creo, asi que se
      // avisa claramente en vez de dejarlo como un error generico 500.
      if (updateError.message.includes("duplicate key")) {
        return NextResponse.json({ success: false, error: "Esta orden de PayPal ya fue usada para confirmar otro cobro. El asiento contable se creo; revisa el Libro Diario antes de reintentar." }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "El asiento se creo pero no se pudo actualizar la factura: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Cobro verificado y registrado. Asiento Nº" + nextNumber + "." });
  } catch (error: any) {
    console.error("AR INVOICE PAYPAL CONFIRM ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}