import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface HistoricalBill {
  bill_number: string;
  issue_date: string;
  amount: number;
}

export interface AnomalyCheckResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  anomalies: string[];
  recommendation: string;
}

export async function detectInvoiceAnomaly(
  vendorName: string,
  newBillNumber: string,
  newIssueDate: string,
  newAmount: number,
  historicalBills: HistoricalBill[]
): Promise<AnomalyCheckResult> {
  try {
    const isDuplicateNumber = historicalBills.some((b) => b.bill_number === newBillNumber);
    const isFirstTimeVendor = historicalBills.length === 0;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Eres un auditor especializado en deteccion de fraude de facturacion. Analiza esta factura nueva contra el historial REAL de facturas de este mismo proveedor para esta misma empresa, buscando anomalias que sugieran una factura fantasma, duplicada, o con monto alterado.

PROVEEDOR: ${vendorName}

FACTURA NUEVA:
Numero: ${newBillNumber}
Fecha: ${newIssueDate}
Monto: $${newAmount}

HISTORIAL REAL DE FACTURAS DE ESTE PROVEEDOR (${historicalBills.length} facturas previas):
${historicalBills.length === 0 ? "Ninguna - este es el primer registro de este proveedor." : historicalBills.map((b) => `- Numero: ${b.bill_number}, Fecha: ${b.issue_date}, Monto: $${b.amount}`).join("\n")}

DATOS TECNICOS YA VERIFICADOS (no los recalcules, usalos como estan):
- Numero de factura duplicado exacto en el historial: ${isDuplicateNumber ? "SI" : "NO"}
- Es la primera factura registrada de este proveedor: ${isFirstTimeVendor ? "SI" : "NO"}

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "riskLevel": "LOW" o "MEDIUM" o "HIGH",
  "anomalies": ["lista de anomalias especificas detectadas, basadas UNICAMENTE en los datos reales mostrados arriba, array vacio si no hay ninguna"],
  "recommendation": "recomendacion profesional breve"
}

Considera como anomalias relevantes: numero de factura duplicado (siempre HIGH), monto muy superior al rango historico normal de este proveedor sin explicacion aparente, numero de factura fuera de la secuencia logica esperada, proveedor nuevo con monto inusualmente alto para ser primera transaccion. Si el historial es muy corto (menos de 3 facturas) o inexistente, se conservador con el nivel de riesgo salvo que haya una anomalia clara como duplicado exacto.`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      riskLevel: parsed.riskLevel ?? "LOW",
      anomalies: parsed.anomalies ?? [],
      recommendation: parsed.recommendation ?? "Revision manual recomendada.",
    };
  } catch (error) {
    console.error("[INVOICE ANOMALY AGENT ERROR]", error);
    return {
      riskLevel: "LOW",
      anomalies: ["No se pudo completar el analisis automatizado."],
      recommendation: "Intenta de nuevo o realiza revision manual.",
    };
  }
}