import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SuggestedInput {
  description: string;
  unit: string;
  quantity: number;
}

export interface ApuSuggestion {
  materials: SuggestedInput[];
  equipment: SuggestedInput[];
  labor: { positionName: string; quantity: number; days: number }[];
  summary: string;
}

export async function suggestApuInputs(
  partidaDescription: string,
  categoryHint?: string
): Promise<ApuSuggestion> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Eres un asistente tecnico de presupuestos de Analisis de Precios Unitarios (APU) para licitaciones de obras, servicios y bienes en Venezuela.

Un contratista va a preparar una oferta para la siguiente partida:
Descripcion: "${partidaDescription}"
${categoryHint ? "Categoria de clasificacion (SNC/UNSPSC): " + categoryHint : ""}

Sugiere una lista tipica y razonable de:
1. Materiales necesarios (descripcion, unidad de medida, cantidad estimada tipica)
2. Equipos necesarios (descripcion, unidad de medida, cantidad estimada tipica)
3. Mano de obra necesaria (cargo/posicion, cantidad de personas, dias estimados tipicos)

IMPORTANTE: NO sugieras precios ni costos unitarios, solo cantidades y descripciones tipicas. El profesional que prepara la oferta decidira los costos reales segun su propio conocimiento de mercado.

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "materials": [{ "description": "...", "unit": "...", "quantity": 0 }],
  "equipment": [{ "description": "...", "unit": "...", "quantity": 0 }],
  "labor": [{ "positionName": "...", "quantity": 0, "days": 0 }],
  "summary": "breve nota de 1-2 frases sobre consideraciones especiales de esta partida"
}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      materials: parsed.materials ?? [],
      equipment: parsed.equipment ?? [],
      labor: parsed.labor ?? [],
      summary: parsed.summary ?? "",
    };
  } catch (error) {
    console.error("[APU SUGGESTION AGENT ERROR]", error);
    return { materials: [], equipment: [], labor: [], summary: "No se pudo generar la sugerencia automatica." };
  }
}