import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ReconstructedTransaction {
  date: string;
  description: string;
  debitAccountName: string;
  debitAccountType: string;
  creditAccountName: string;
  creditAccountType: string;
  amount: number;
  sourceDocument: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface ReconstructionResult {
  transactions: ReconstructedTransaction[];
  warnings: string[];
  documentSummary: string;
}

const ACCOUNT_TYPES = "ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE";

export async function reconstructAccountingFromDocument(
  documentText: string,
  documentName: string
): Promise<ReconstructionResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Eres un contador forense experto en reconstruccion contable a partir de evidencia documental (estados de cuenta bancarios, facturas, contratos, recibos). Tu tarea es identificar CADA transaccion financiera real mencionada en este documento y proponer su registro contable en partida doble.

NOMBRE DEL DOCUMENTO: ${documentName}

CONTENIDO DEL DOCUMENTO:
${documentText.slice(0, 15000)}

Para cada transaccion identificada, determina:
1. La fecha de la transaccion
2. Una descripcion breve y clara
3. Que cuenta se debita y su tipo (${ACCOUNT_TYPES})
4. Que cuenta se acredita y su tipo (${ACCOUNT_TYPES})
5. El monto exacto
6. Tu nivel de confianza en la clasificacion

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "documentSummary": "resumen breve de que tipo de documento es y que periodo cubre",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descripcion clara de la transaccion",
      "debitAccountName": "nombre de la cuenta que se debita (ej. Banco, Gastos de Oficina, Cuentas por Cobrar)",
      "debitAccountType": "uno de: ${ACCOUNT_TYPES}",
      "creditAccountName": "nombre de la cuenta que se acredita",
      "creditAccountType": "uno de: ${ACCOUNT_TYPES}",
      "amount": numero decimal exacto,
      "sourceDocument": "${documentName}",
      "confidence": "HIGH" si la clasificacion contable es clara y sin ambiguedad, "MEDIUM" si es razonable pero podria interpretarse distinto, "LOW" si es una suposicion con poca evidencia
    }
  ],
  "warnings": ["lista de advertencias sobre transacciones ambiguas, montos ilegibles, o informacion faltante, array vacio si todo esta claro"]
}

Reglas importantes:
- No inventes transacciones que no esten respaldadas por el texto del documento
- Si un monto o fecha no es legible, omite esa transaccion y agrega una advertencia en su lugar
- Usa nombres de cuenta contables estandar y genericos (aplicables a cualquier pais), no jerga de un sistema contable especifico
- Si el documento no contiene transacciones financieras identificables, devuelve un array de transacciones vacio con una advertencia explicando por que`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      warnings: parsed.warnings ?? [],
      documentSummary: parsed.documentSummary ?? "",
    };
  } catch (error) {
    console.error("[RECONSTRUCTION AGENT ERROR]", error);
    return {
      transactions: [],
      warnings: ["No se pudo procesar el documento para reconstruccion contable. Intenta de nuevo o revisa manualmente."],
      documentSummary: "",
    };
  }
}