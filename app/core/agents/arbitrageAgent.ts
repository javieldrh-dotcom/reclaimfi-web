import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface FlaggedTransaction {
  date: string;
  description: string;
  amount: number;
  exchangeRateUsed: number;
  nearestRateChangeDate: string;
  rateBeforeChange: number;
  rateAfterChange: number;
  daysFromChange: number;
}

export interface ArbitrageAnalysisResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  findings: string[];
  recommendation: string;
}

export async function analyzeArbitragePattern(
  currency: string,
  flaggedTransactions: FlaggedTransaction[]
): Promise<ArbitrageAnalysisResult> {
  if (flaggedTransactions.length === 0) {
    return {
      riskLevel: "LOW",
      findings: [],
      recommendation: "No se detectaron transacciones registradas cerca de cambios significativos de tasa de cambio en el periodo analizado.",
    };
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Eres un auditor forense especializado en deteccion de arbitraje cambiario fraudulento (aprovechamiento indebido de diferenciales de tasa de cambio oficial). Analiza estas transacciones REALES que fueron registradas cerca de cambios significativos en la tasa de cambio de ${currency}.

TRANSACCIONES DETECTADAS CERCA DE CAMBIOS DE TASA:
${flaggedTransactions.map((t, i) => `${i + 1}. Fecha: ${t.date} | ${t.description} | Monto: $${t.amount} | Tasa usada: ${t.exchangeRateUsed} | Cambio de tasa mas cercano: ${t.nearestRateChangeDate} (de ${t.rateBeforeChange} a ${t.rateAfterChange}) | Dias de diferencia: ${t.daysFromChange}`).join("\n")}

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "riskLevel": "LOW" o "MEDIUM" o "HIGH",
  "findings": ["lista de hallazgos especificos basados unicamente en los datos mostrados, por ejemplo patrones de montos grandes justo antes de una devaluacion, o transacciones repetidas del mismo tipo cerca de multiples cambios de tasa, array vacio si no hay patron claro"],
  "recommendation": "recomendacion profesional breve sobre si amerita investigacion adicional"
}

Se conservador: el simple hecho de que una transaccion caiga cerca de un cambio de tasa NO es evidencia de fraude por si sola (las operaciones normales de un negocio ocurren en cualquier fecha). Solo eleva el riesgo si observas un PATRON (varias transacciones agrupadas de forma que sugiera cronometraje deliberado, montos inusualmente grandes, o concentracion en fechas especificas). No inventes conexiones no sustentadas por los datos.`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      riskLevel: parsed.riskLevel ?? "LOW",
      findings: parsed.findings ?? [],
      recommendation: parsed.recommendation ?? "Revision manual recomendada.",
    };
  } catch (error) {
    console.error("[ARBITRAGE ANALYSIS AGENT ERROR]", error);
    return {
      riskLevel: "LOW",
      findings: ["No se pudo completar el analisis automatizado."],
      recommendation: "Intenta de nuevo o realiza revision manual.",
    };
  }
}