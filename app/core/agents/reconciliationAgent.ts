import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AccountingRecord {
  date: string;
  description: string;
  amountUsd: number;
}

export interface BlockchainTransaction {
  date: string;
  valueBtc: number;
  direction: "IN" | "OUT";
}

export interface ReconciliationResult {
  matchStatus: "MATCH" | "DISCREPANCY" | "NO_EVIDENCE";
  findings: string[];
  recommendation: string;
}

export async function reconcileWithBlockchain(
  record: AccountingRecord,
  walletAddress: string,
  btcUsdRateApprox: number,
  blockchainTransactions: BlockchainTransaction[]
): Promise<ReconciliationResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Eres un auditor forense conciliando un registro contable con la evidencia REAL de la blockchain de Bitcoin, para determinar si lo que la empresa registro en sus libros coincide con lo que realmente ocurrio en la cadena.

REGISTRO CONTABLE (lo que la empresa dice que paso):
Fecha: ${record.date}
Descripcion: ${record.description}
Monto: $${record.amountUsd} USD

WALLET INVOLUCRADA: ${walletAddress}
Tasa BTC/USD aproximada usada para conversion: $${btcUsdRateApprox}

TRANSACCIONES REALES EN LA BLOCKCHAIN PARA ESTA WALLET (cercanas a la fecha del registro contable):
${blockchainTransactions.length === 0 ? "Ninguna transaccion encontrada en la blockchain cerca de esta fecha." : blockchainTransactions.map((t) => `- ${t.date}: ${t.direction === "IN" ? "Recibio" : "Envio"} ${t.valueBtc} BTC (aprox $${(t.valueBtc * btcUsdRateApprox).toFixed(2)} USD)`).join("\n")}

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "matchStatus": "MATCH" si el monto y la fecha del registro contable coinciden razonablemente con una transaccion real en la blockchain, "DISCREPANCY" si hay una transaccion cercana pero el monto o fecha no coincide de forma significativa, "NO_EVIDENCE" si no hay ninguna transaccion en la blockchain que respalde el registro contable,
  "findings": ["lista de hallazgos especificos comparando el registro contable contra la evidencia real de blockchain"],
  "recommendation": "recomendacion profesional breve"
}

Considera una tolerancia razonable en el monto (diferencias menores por fluctuacion de tasa de cambio en el momento exacto no son necesariamente una discrepancia grave) pero senala claramente si la diferencia es sustancial (mas de 15-20%) o si la fecha no tiene ninguna transaccion cercana.`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      matchStatus: parsed.matchStatus ?? "NO_EVIDENCE",
      findings: parsed.findings ?? [],
      recommendation: parsed.recommendation ?? "Revision manual recomendada.",
    };
  } catch (error) {
    console.error("[RECONCILIATION AGENT ERROR]", error);
    return {
      matchStatus: "NO_EVIDENCE",
      findings: ["No se pudo completar la conciliacion automatizada."],
      recommendation: "Intenta de nuevo o realiza revision manual.",
    };
  }
}