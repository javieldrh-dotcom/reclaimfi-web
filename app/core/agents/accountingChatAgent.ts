import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AccountingSummary {
  companyName: string;
  currency: string;
  accountBalances: { code: string; name: string; type: string; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenueYTD: number;
  totalExpenseYTD: number;
}

export async function answerAccountingQuestion(
  summary: AccountingSummary,
  question: string
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Eres un asistente contable para la empresa "${summary.companyName}" (moneda: ${summary.currency}).

Responde la pregunta del usuario UNICAMENTE usando estos datos. Si la pregunta pide algo que no esta en estos datos, dilo claramente y sugiere donde podria encontrarlo en el sistema (ej. "revisa el Libro Mayor para el detalle de movimientos"). No inventes cifras. Responde en español, de forma breve y directa, con los montos formateados con 2 decimales.

DATOS DISPONIBLES:
Total Activos: ${summary.totalAssets.toFixed(2)}
Total Pasivos: ${summary.totalLiabilities.toFixed(2)}
Total Patrimonio: ${summary.totalEquity.toFixed(2)}
Total Ingresos (ano en curso): ${summary.totalRevenueYTD.toFixed(2)}
Total Gastos (ano en curso): ${summary.totalExpenseYTD.toFixed(2)}

Saldos por cuenta:
${summary.accountBalances.map((a) => `${a.code} - ${a.name} (${a.type}): ${a.balance.toFixed(2)}`).join("\n")}

PREGUNTA DEL USUARIO: ${question}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("[ACCOUNTING CHAT AGENT ERROR]", error);
    return "No se pudo procesar la pregunta en este momento. Intenta de nuevo.";
  }
}