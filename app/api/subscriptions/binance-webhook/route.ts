import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { verifyBinanceWebhookSignature } from "@/app/lib/binancePay";

// Webhook server-to-server de Binance Pay. Nunca trae sesion de usuario
// (la llamada la hace Binance, no un navegador logueado), asi que usa el
// cliente con service_role key -- igual que createLedgerServiceClient en
// app/lib/supabase/serviceClient.ts, pero este archivo necesita leer y
// escribir en `subscriptions`/`user_role_assignments`, no en event_ledger,
// por eso no se reutiliza ese helper (su comentario lo deja explicito
// como exclusivo del ledger) y se crea el cliente directo aqui.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL en el servidor.");
  }
  return createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

function ack(returnCode: "SUCCESS" | "FAIL", returnMessage: string | null = null) {
  // Formato de respuesta exacto que exige la documentacion oficial de
  // Binance Pay para reconocer la notificacion. "FAIL" hace que Binance
  // reintente el webhook (hasta 6 veces); se usa solo cuando el problema
  // es nuestro y reintentar puede ayudar (ej. no se pudo escribir en la
  // base de datos), nunca para notificaciones que no aplican.
  return NextResponse.json({ returnCode, returnMessage });
}

export async function POST(request: Request) {
  // CRITICO: la firma se calcula sobre el BODY CRUDO exacto que Binance
  // envio -- hay que leerlo como texto ANTES de parsearlo como JSON. Si se
  // usara request.json() primero y se re-serializara el objeto para
  // verificar, el resultado casi seguro no seria byte-a-byte igual
  // (orden de llaves, espacios) y la firma fallaria siempre.
  const rawBody = await request.text();

  const timestamp = request.headers.get("binancepay-timestamp");
  const nonce = request.headers.get("binancepay-nonce");
  const signature = request.headers.get("binancepay-signature");
  const certificateSn = request.headers.get("binancepay-certificate-sn");

  if (!timestamp || !nonce || !signature) {
    console.error("BINANCE WEBHOOK: faltan headers de firma.");
    return ack("FAIL", "Faltan headers de firma.");
  }

  let isValid = false;
  try {
    isValid = await verifyBinanceWebhookSignature({ timestamp, nonce, rawBody, signatureBase64: signature, certificateSn });
  } catch (err: any) {
    console.error("BINANCE WEBHOOK: error verificando firma:", err.message);
    return ack("FAIL", "No se pudo verificar la firma.");
  }

  if (!isValid) {
    // Firma invalida: alguien (o algo) esta intentando falsificar una
    // notificacion de pago exitoso. Nunca se procesa el contenido de un
    // webhook cuya firma no se pudo verificar contra la llave publica
    // real de Binance.
    console.error("BINANCE WEBHOOK: firma invalida, notificacion descartada.");
    return ack("FAIL", "Firma invalida.");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return ack("FAIL", "Body no es JSON valido.");
  }

  if (payload.bizType !== "PAY") {
    // Tipo de evento que no nos interesa (segun la documentacion, bizType
    // siempre es "PAY" para esta notificacion, pero se deja la guarda por
    // si Binance agrega otros tipos en el futuro). Se reconoce como
    // exitoso para que Binance no reintente algo que nunca vamos a usar.
    return ack("SUCCESS");
  }

  // "data" llega como STRING con JSON codificado adentro (confirmado en
  // la documentacion oficial), no como objeto anidado directo.
  let inner: any;
  try {
    inner = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
  } catch {
    console.error("BINANCE WEBHOOK: no se pudo parsear el campo 'data'.");
    return ack("FAIL", "Campo 'data' invalido.");
  }

  const merchantTradeNo: string | undefined = inner?.merchantTradeNo;
  const bizStatus: string | undefined = payload.bizStatus;

  if (!merchantTradeNo) {
    console.error("BINANCE WEBHOOK: notificacion sin merchantTradeNo.");
    return ack("FAIL", "Falta merchantTradeNo.");
  }

  if (bizStatus !== "PAY_SUCCESS") {
    // PAY_CLOSED / PAY_FAIL (u otro estado no exitoso): no hay nada que
    // activar. Se reconoce como exitoso -- no es un error nuestro, es
    // informacion de que el pago no se completo.
    return ack("SUCCESS");
  }

  const supabase = createServiceClient();

  const { data: subscription, error: lookupError } = await supabase
    .from("subscriptions")
    .select("id, status, plan_id, company_id")
    .eq("binance_merchant_trade_no", merchantTradeNo)
    .maybeSingle();

  if (lookupError) {
    console.error("BINANCE WEBHOOK: error buscando la suscripcion:", lookupError.message);
    return ack("FAIL", "Error de base de datos.");
  }
  if (!subscription) {
    // No deberia pasar nunca: el merchantTradeNo se guarda en la fila
    // ANTES de devolver el checkoutUrl al usuario (ver
    // /api/subscriptions/binance-create-order), asi que para que Binance
    // llegue a notificar un pago, la fila ya tiene que existir. Si esto
    // ocurre es un bug real que hay que investigar -- se registra fuerte
    // en los logs, pero se reconoce como "SUCCESS" para no quedar
    // reintentando algo que un reintento no va a resolver.
    console.error("BINANCE WEBHOOK: no se encontro ninguna suscripcion con merchantTradeNo=" + merchantTradeNo + ". Revisar manualmente.");
    return ack("SUCCESS");
  }

  if (subscription.status === "ACTIVE") {
    // Notificacion duplicada (Binance puede reenviar el mismo webhook).
    // Idempotente: no se vuelve a activar ni se extiende la fecha.
    return ack("SUCCESS");
  }

  // Binance Pay, a traves de esta API de Create Order, es un cobro UNICO
  // por orden -- no existe aqui un objeto de "suscripcion recurrente" como
  // el de PayPal (que trae su propio next_billing_time). Se activa por un
  // (1) mes desde hoy, igual que un pago manual aprobado; renovar el mes
  // siguiente requiere que el usuario vuelva a pagar y se genere una
  // orden nueva. Es una limitacion real del metodo, no un dato inventado.
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "ACTIVE",
      approved_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString().slice(0, 10),
    })
    .eq("id", subscription.id);

  if (updateError) {
    console.error("BINANCE WEBHOOK: error activando la suscripcion:", updateError.message);
    return ack("FAIL", "No se pudo activar la suscripcion.");
  }

  console.log("BINANCE WEBHOOK: suscripcion " + subscription.id + " activada via Binance Pay (merchantTradeNo=" + merchantTradeNo + ").");
  return ack("SUCCESS");
}