import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface IntelAnalysisResult {
  classification: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  keyObservations: string[];
  recommendation: string;
}

export async function analyzeInvestigationNotes(scenario: string): Promise<IntelAnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Eres un analista de inteligencia financiera experimentado. Analiza estas notas de investigacion escritas por un investigador humano, y da tu evaluacion profesional.

NOTAS DE INVESTIGACION:
${scenario}

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "classification": "clasificacion breve de la situacion descrita (ej. 'Actividad Operacional Normal', 'Posible Lavado de Dinero', 'Revision de Cumplimiento Requerida', 'Informacion Insuficiente')",
  "priority": "LOW" o "MEDIUM" o "HIGH" o "CRITICAL",
  "keyObservations": ["lista de observaciones especificas basadas UNICAMENTE en lo que el investigador escribio, sin inventar detalles no mencionados"],
  "recommendation": "recomendacion profesional breve sobre los siguientes pasos"
}

Se conservador y basate solo en lo que el texto realmente dice. Si las notas son vagas o no contienen suficiente informacion para una evaluacion solida, dilo explicitamente en la clasificacion y prioridad (LOW), en vez de inventar señales de alarma que no estan sustentadas por el texto.`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      classification: parsed.classification ?? "No determinado",
      priority: parsed.priority ?? "LOW",
      keyObservations: parsed.keyObservations ?? [],
      recommendation: parsed.recommendation ?? "Revision manual recomendada.",
    };
  } catch (error) {
    console.error("[INTEL ANALYSIS AGENT ERROR]", error);
    return {
      classification: "Error de procesamiento",
      priority: "LOW",
      keyObservations: ["No se pudo completar el analisis automatizado."],
      recommendation: "Intenta de nuevo o realiza revision manual.",
    };
  }
}