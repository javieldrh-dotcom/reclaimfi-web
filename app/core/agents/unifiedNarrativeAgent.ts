import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface UnifiedNarrativeInput {
  caseTitle: string;
  caseDescription: string;
  documentaryFindings: string;
  walletAnalyses: {
    address: string;
    riskLevel: string;
    ofacSanctioned: boolean;
    summary: string;
  }[];
}

export async function generateUnifiedNarrative(input: UnifiedNarrativeInput): Promise<string> {
  try {
    const walletSection = input.walletAnalyses.length > 0
      ? input.walletAnalyses.map((w) => `- Wallet ${w.address}: Riesgo ${w.riskLevel}${w.ofacSanctioned ? " (SANCIONADA POR OFAC)" : ""}. ${w.summary}`).join("\n")
      : "No se vincularon analisis de blockchain a este caso.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Eres un auditor forense senior redactando la seccion narrativa de un informe de investigacion, para ser presentado a un regulador o en un proceso judicial. Combina la evidencia documental tradicional con los hallazgos de blockchain en una narrativa UNICA y coherente, no como dos secciones separadas.

CASO: ${input.caseTitle}
DESCRIPCION: ${input.caseDescription}

HALLAZGOS DOCUMENTALES (contabilidad reconstruida, evidencia en papel):
${input.documentaryFindings || "No hay hallazgos documentales registrados."}

HALLAZGOS DE BLOCKCHAIN:
${walletSection}

Escribe una narrativa profesional en español, en tono formal de informe de auditoria forense, de 3 a 5 parrafos, que:
1. Presente el contexto del caso
2. Integre los hallazgos documentales y de blockchain en una sola linea de razonamiento (no los trates como temas separados)
3. Senale explicitamente cualquier conexion entre lo que muestran los documentos y lo que muestra la blockchain (por ejemplo, si una transaccion documentada coincide en tiempo o monto con actividad de una wallet)
4. Concluya con una evaluacion de riesgo consolidada

No inventes conexiones que no esten sustentadas por los datos proporcionados. Si no hay suficiente informacion para conectar ambos tipos de evidencia, dilo explicitamente en vez de forzar una conclusion.`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : "No se pudo generar la narrativa.";
  } catch (error) {
    console.error("[UNIFIED NARRATIVE AGENT ERROR]", error);
    return "No se pudo generar la narrativa unificada. Intenta de nuevo o redacta manualmente.";
  }
}