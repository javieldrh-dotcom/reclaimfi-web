import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface WalletAnalysisResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  behavior: string;
  activityType: string;
  reasons: string[];
  recommendation: string;
}

export async function analyzeWalletData(
  address: string,
  balanceBtc: number,
  txCount: number,
  totalReceivedBtc: number,
  totalSentBtc: number,
  recentTransactions: { timestamp: string; valueBtc: number; direction: "IN" | "OUT" }[]
): Promise<WalletAnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Eres un analista forense especializado en investigacion de blockchain y prevencion de lavado de dinero (AML). Analiza estos datos REALES de una direccion de Bitcoin y evalua el riesgo.

DATOS REALES DE LA WALLET:
Direccion: ${address}
Balance actual: ${balanceBtc} BTC
Numero total de transacciones: ${txCount}
Total recibido historico: ${totalReceivedBtc} BTC
Total enviado historico: ${totalSentBtc} BTC
Transacciones recientes (mas nuevas primero):
${recentTransactions.map((t) => `- ${t.timestamp}: ${t.direction === "IN" ? "Recibio" : "Envio"} ${t.valueBtc} BTC`).join("\n")}

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "riskLevel": "LOW" o "MEDIUM" o "HIGH",
  "behavior": "descripcion breve del patron de comportamiento observado (ej. 'Actividad regular de bajo volumen', 'Alta velocidad de transacciones', 'Patron de acumulacion')",
  "activityType": "clasificacion breve (ej. 'Operacional', 'Posible exchange', 'Actividad inusual')",
  "reasons": ["lista de razones especificas observadas en los datos reales que sustentan la calificacion de riesgo, basadas unicamente en los numeros mostrados arriba, sin inventar informacion que no este en los datos"],
  "recommendation": "recomendacion profesional breve basada en los datos reales observados"
}

Basa tu analisis UNICAMENTE en los datos reales proporcionados (volumen, frecuencia, patrones de entrada/salida). No inventes conexiones con mezcladores, exchanges especificos, u otras wallets a menos que los datos lo sugieran directamente (por ejemplo, un volumen y frecuencia extremadamente altos). Se conservador: la mayoria de wallets con actividad normal deben calificar como LOW.`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      riskLevel: parsed.riskLevel ?? "LOW",
      behavior: parsed.behavior ?? "No determinado",
      activityType: parsed.activityType ?? "No determinado",
      reasons: parsed.reasons ?? [],
      recommendation: parsed.recommendation ?? "Revision manual recomendada.",
    };
  } catch (error) {
    console.error("[WALLET ANALYSIS AGENT ERROR]", error);
    return {
      riskLevel: "LOW",
      behavior: "No se pudo completar el analisis automatizado",
      activityType: "Pendiente de revision",
      reasons: ["Error tecnico al procesar el analisis con IA."],
      recommendation: "Intenta de nuevo o realiza revision manual.",
    };
  }
}