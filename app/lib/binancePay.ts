import crypto from "crypto";

// Cliente de la API de Binance Pay. Dos flujos de firma DISTINTOS, ambos
// verificados contra la documentacion oficial de Binance (developers.binance.com)
// antes de escribir este archivo -- nada aqui esta adivinado de memoria,
// por tratarse de dinero real:
//
// 1) SALIENTE (nosotros -> Binance: crear orden, consultar certificado):
//    HMAC-SHA512 con nuestra secret key.
//      payload   = timestamp + "\n" + nonce + "\n" + body + "\n"
//      signature = hex(hmac("sha512", payload, secretKey)).toUpperCase()
//    Headers: content-type, BinancePay-Timestamp, BinancePay-Nonce,
//    BinancePay-Certificate-SN (nuestra "API identity key", la emite
//    Binance junto con la API key/secret), BinancePay-Signature.
//
// 2) ENTRANTE (Binance -> nosotros: webhook de notificacion de pago):
//    RSA-SHA256, verificado con la LLAVE PUBLICA de Binance (NO con
//    nuestra secret key -- es un esquema distinto). La llave publica se
//    obtiene con la API "Query Certificate"
//    (POST /binancepay/openapi/certificates, autenticada con el esquema
//    (1)). Mismo formato de payload que (1); la firma del header viene
//    en base64 y hay que decodificarla antes de verificar.
//
// Variables de entorno requeridas en Vercel (Javiel debe configurarlas en
// su panel de Binance Pay Merchant -> API Management, igual que ya hizo
// con PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET):
//   BINANCE_PAY_API_KEY           -> header BinancePay-Certificate-SN
//   BINANCE_PAY_SECRET_KEY        -> llave para firmar HMAC-SHA512
const BINANCE_PAY_API_BASE = "https://bpay.binanceapi.com";

function requireBinanceCredentials(): { apiKey: string; secretKey: string } {
  const apiKey = process.env.BINANCE_PAY_API_KEY;
  const secretKey = process.env.BINANCE_PAY_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error(
      "Binance Pay no esta configurado en el servidor (faltan BINANCE_PAY_API_KEY / BINANCE_PAY_SECRET_KEY)."
    );
  }
  return { apiKey, secretKey };
}

function randomNonce(): string {
  // BinancePay-Nonce: string aleatorio de 32 caracteres ASCII (a-z, A-Z),
  // segun la documentacion oficial.
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 32; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

function signHmac(timestamp: string, nonce: string, body: string, secretKey: string): string {
  const payload = timestamp + "\n" + nonce + "\n" + body + "\n";
  return crypto.createHmac("sha512", secretKey).update(payload, "utf8").digest("hex").toUpperCase();
}

// Llamada autenticada generica contra la API de Binance Pay (esquema de
// firma SALIENTE, HMAC-SHA512).
async function binancePayRequest(path: string, body: Record<string, any>): Promise<any> {
  const { apiKey, secretKey } = requireBinanceCredentials();
  const timestamp = Date.now().toString();
  const nonce = randomNonce();
  const bodyStr = JSON.stringify(body);
  const signature = signHmac(timestamp, nonce, bodyStr, secretKey);

  const res = await fetch(BINANCE_PAY_API_BASE + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": apiKey,
      "BinancePay-Signature": signature,
    },
    body: bodyStr,
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json) {
    throw new Error("Binance Pay respondio con un error HTTP " + res.status + (json?.errorMessage ? ": " + json.errorMessage : ""));
  }
  return json;
}

export interface CreateBinanceOrderParams {
  merchantTradeNo: string; // <= 32 caracteres, unico
  fiatAmount: number;
  fiatCurrency: string; // ej. "USD"
  goodsName: string;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface CreateBinanceOrderResult {
  prepayId: string;
  checkoutUrl: string;
  universalUrl: string;
  deeplink: string;
  qrcodeLink: string;
  expireTime: number;
}

// Crea una orden de cobro (Create Order V2 -- la V1, con "tradeType" a
// nivel raiz, esta marcada como deprecated en la documentacion oficial).
export async function createBinanceOrder(params: CreateBinanceOrderParams): Promise<CreateBinanceOrderResult> {
  const body: Record<string, any> = {
    env: { terminalType: "WEB" },
    merchantTradeNo: params.merchantTradeNo,
    fiatAmount: params.fiatAmount,
    fiatCurrency: params.fiatCurrency,
    goods: {
      // "02" = bien virtual (es una suscripcion de software, no un
      // producto fisico). No existe categoria "software/SaaS" en el
      // enum oficial de goodsCategory; "Z000" (otros) es la que mejor
      // aplica sin forzar una categoria incorrecta (ej. "electronica").
      goodsType: "02",
      goodsCategory: "Z000",
      referenceGoodsId: params.merchantTradeNo,
      goodsName: params.goodsName,
    },
  };
  if (params.returnUrl) body.returnUrl = params.returnUrl;
  if (params.cancelUrl) body.cancelUrl = params.cancelUrl;
  if (params.webhookUrl) body.webhookUrl = params.webhookUrl;

  const json = await binancePayRequest("/binancepay/openapi/v2/order", body);
  if (json.status !== "SUCCESS" || !json.data) {
    throw new Error("Binance Pay rechazo la creacion de la orden: " + (json.errorMessage || json.code || "sin detalle"));
  }
  return {
    prepayId: json.data.prepayId,
    checkoutUrl: json.data.checkoutUrl,
    universalUrl: json.data.universalUrl,
    deeplink: json.data.deeplink,
    qrcodeLink: json.data.qrcodeLink,
    expireTime: json.data.expireTime,
  };
}

// Cache en memoria del certificado publico de Binance (cambia muy rara
// vez). Se recarga si tiene mas de 12 horas, o si una verificacion de
// firma falla (podria haber rotado). No se persiste en base de datos:
// es puramente un ahorro de llamadas dentro de la misma instancia de
// servidor; si el proceso se reinicia, se vuelve a pedir sin problema.
let certCache: { certs: Array<{ certSerial: string; certPublic: string }>; fetchedAt: number } | null = null;
const CERT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

async function fetchBinancePublicCertificates(forceRefresh = false): Promise<Array<{ certSerial: string; certPublic: string }>> {
  if (!forceRefresh && certCache && Date.now() - certCache.fetchedAt < CERT_CACHE_TTL_MS) {
    return certCache.certs;
  }
  const json = await binancePayRequest("/binancepay/openapi/certificates", {});
  if (json.status !== "SUCCESS" || !json.data) {
    throw new Error("No se pudo obtener el certificado publico de Binance Pay: " + (json.errorMessage || json.code || "sin detalle"));
  }
  // La documentacion oficial solo confirma los campos certSerial/certPublic
  // dentro de "data", sin aclarar si es un objeto unico o una lista (un
  // merchant puede tener mas de un certificado activo durante una
  // rotacion). Se soportan ambas formas.
  const raw = Array.isArray(json.data) ? json.data : [json.data];
  const certs = raw.map((c: any) => ({ certSerial: String(c.certSerial), certPublic: String(c.certPublic) }));
  certCache = { certs, fetchedAt: Date.now() };
  return certs;
}

function toPemPublicKey(certPublic: string): string {
  if (certPublic.includes("BEGIN PUBLIC KEY")) return certPublic;
  // Si Binance devuelve solo el base64 "pelado" (sin encabezados PEM), se
  // envuelve en el formato estandar que espera crypto.createVerify.
  const lines = certPublic.match(/.{1,64}/g) ?? [certPublic];
  return "-----BEGIN PUBLIC KEY-----\n" + lines.join("\n") + "\n-----END PUBLIC KEY-----";
}

export interface VerifyWebhookParams {
  timestamp: string;
  nonce: string;
  rawBody: string;
  signatureBase64: string;
  certificateSn?: string | null;
}

// Verifica la firma de una notificacion de webhook ENTRANTE. Esquema
// confirmado en la documentacion oficial ("Webhook Common Rules"):
// RSA-SHA256 contra la llave PUBLICA de Binance (no la secret key
// compartida que se usa para firmar llamadas salientes).
export async function verifyBinanceWebhookSignature(params: VerifyWebhookParams): Promise<boolean> {
  const payload = params.timestamp + "\n" + params.nonce + "\n" + params.rawBody + "\n";

  async function tryVerify(forceRefresh: boolean): Promise<boolean> {
    const certs = await fetchBinancePublicCertificates(forceRefresh);
    const candidates = params.certificateSn
      ? certs.filter((c) => c.certSerial === params.certificateSn)
      : certs;
    const toCheck = candidates.length > 0 ? candidates : certs;
    for (const cert of toCheck) {
      try {
        const verifier = crypto.createVerify("RSA-SHA256");
        verifier.update(payload, "utf8");
        verifier.end();
        const ok = verifier.verify(toPemPublicKey(cert.certPublic), params.signatureBase64, "base64");
        if (ok) return true;
      } catch {
        // formato de llave invalido para este candidato, probar el siguiente
      }
    }
    return false;
  }

  if (await tryVerify(false)) return true;
  // El certificado pudo haber rotado desde la ultima vez que se cacheo;
  // se intenta una sola vez mas forzando una consulta fresca antes de
  // declarar la firma invalida.
  return await tryVerify(true);
}