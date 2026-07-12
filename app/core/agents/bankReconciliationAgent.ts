import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ReconciliationMatch {
  bookDescription: string | null;
  bankLine: string | null;
  status: "MATCHED" | "ONLY_IN_BOOK" | "ONLY_IN_BANK" | "AMOUNT_MISMATCH";
  explanation: string;
}

export interface ReconciliationResult {
  matches: ReconciliationMatch[];
  summary: string;
}

export async function reconcileBankStatement(
  bookMovements: { description: string; amount: number }[],
  bankLines: string[]
): Promise<ReconciliationResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Eres un agente de conciliacion bancaria contable. Compara los movimientos del libro contable de la empresa contra las lineas del estado de cuenta del banco.

MOVIMIENTOS DEL LIBRO CONTABLE:
${JSON.stringify(bookMovements, null, 2)}

LINEAS DEL ESTADO DE CUENTA DEL BANCO (texto sin procesar, una linea por movimiento):
${bankLines.join("\n")}

Para cada movimiento, determina si:
- MATCHED: aparece en ambos lados con el mismo monto
- ONLY_IN_BOOK: esta en el libro contable pero no en el banco
- ONLY_IN_BANK: esta en el banco pero no en el libro contable
- AMOUNT_MISMATCH: aparece en ambos pero con montos distintos

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "matches": [
    { "bookDescription": "texto o null", "bankLine": "texto o null", "status": "MATCHED|ONLY_IN_BOOK|ONLY_IN_BANK|AMOUNT_MISMATCH", "explanation": "explicacion breve en espanol, en lenguaje simple, no tecnico" }
  ],
  "summary": "resumen de 2-3 frases sobre el estado general de la conciliacion, en lenguaje simple"
}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      matches: parsed.matches ?? [],
      summary: parsed.summary ?? "No se pudo generar un resumen.",
    };
  } catch (error) {
    console.error("[RECONCILIATION AGENT ERROR]", error);
    return {
      matches: [],
      summary: "No se pudo completar la conciliacion automatica. Intenta de nuevo o revisa manualmente.",
    };
  }
}