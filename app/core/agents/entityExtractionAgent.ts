import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedEntity {
  entity: string;
  type: string;
  confidence: string;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  summary: string;
}

export async function extractEntitiesFromText(
  fileName: string,
  fileContent: string
): Promise<EntityExtractionResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Eres un agente de analisis forense financiero. Analiza el siguiente documento y extrae entidades relevantes para una investigacion (wallets de criptomonedas, nombres de personas u organizaciones, montos de dinero, cuentas bancarias, fechas relevantes, direcciones de correo).

Nombre del archivo: ${fileName}

Contenido del documento:
${fileContent.slice(0, 8000)}

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "entities": [
    { "entity": "nombre o valor detectado", "type": "WALLET|PERSON|ORGANIZATION|AMOUNT|BANK_ACCOUNT|DATE|EMAIL", "confidence": "HIGH|MEDIUM|LOW" }
  ],
  "summary": "resumen breve de 1-2 frases sobre lo encontrado en el documento"
}

Si el documento esta vacio o no contiene informacion relevante, devuelve entities como un array vacio y explica esto en el summary.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      entities: parsed.entities ?? [],
      summary: parsed.summary ?? "Sin resumen disponible.",
    };
  } catch (error) {
    console.error("[ENTITY EXTRACTION AGENT ERROR]", error);
    return {
      entities: [],
      summary: "No se pudo completar el analisis automatico del documento.",
    };
  }
}