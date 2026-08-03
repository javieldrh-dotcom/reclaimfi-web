import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedInvoiceData {
  vendorName: string;
  vendorTaxId: string;
  invoiceNumber: string;
  controlNumber: string;
  invoiceDate: string;
  baseAmount: number;
  rate: number;
  ivaAmount: number;
  totalAmount: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
}

export async function extractInvoiceData(
  base64Image: string,
  mediaType: string
): Promise<ExtractedInvoiceData> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as any,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Eres un asistente contable especializado en facturas venezolanas. Analiza esta imagen de una factura y extrae los siguientes datos con precision.

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "vendorName": "razon social del vendedor/emisor de la factura",
  "vendorTaxId": "RIF del vendedor, formato J-XXXXXXXXX o V-XXXXXXXXX",
  "invoiceNumber": "numero de factura",
  "controlNumber": "numero de control (empieza usualmente con 00-)",
  "invoiceDate": "fecha en formato YYYY-MM-DD",
  "baseAmount": numero decimal de la base imponible (sin simbolo de moneda),
  "rate": numero decimal de la alicuota de IVA aplicada (ej. 16),
  "ivaAmount": numero decimal del monto de IVA,
  "totalAmount": numero decimal del total de la factura,
  "confidence": "HIGH" si estas seguro de todos los datos, "MEDIUM" si algun dato es ambiguo, "LOW" si la imagen es dificil de leer,
  "warnings": ["lista de advertencias si algo no se pudo leer con certeza, array vacio si todo esta claro"]
}

Si algun campo no aparece en la factura o no se puede leer, usa 0 para numeros o "" para texto, y agrega una advertencia explicando cual campo falta.`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      vendorName: parsed.vendorName ?? "",
      vendorTaxId: parsed.vendorTaxId ?? "",
      invoiceNumber: parsed.invoiceNumber ?? "",
      controlNumber: parsed.controlNumber ?? "",
      invoiceDate: parsed.invoiceDate ?? "",
      baseAmount: parsed.baseAmount ?? 0,
      rate: parsed.rate ?? 16,
      ivaAmount: parsed.ivaAmount ?? 0,
      totalAmount: parsed.totalAmount ?? 0,
      confidence: parsed.confidence ?? "LOW",
      warnings: parsed.warnings ?? [],
    };
  } catch (error) {
    console.error("[INVOICE EXTRACTION AGENT ERROR]", error);
    return {
      vendorName: "",
      vendorTaxId: "",
      invoiceNumber: "",
      controlNumber: "",
      invoiceDate: "",
      baseAmount: 0,
      rate: 16,
      ivaAmount: 0,
      totalAmount: 0,
      confidence: "LOW",
      warnings: ["No se pudo procesar la imagen. Completa los datos manualmente."],
    };
  }
}