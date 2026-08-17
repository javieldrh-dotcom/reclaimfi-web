import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedPartida {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}

export interface ExtractedPliegoData {
  procedureNumber: string;
  projectDescription: string;
  contractingEntity: string;
  partidas: ExtractedPartida[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
}

export async function extractPliegoData(base64Pdf: string): Promise<ExtractedPliegoData> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: `Eres un asistente especializado en licitaciones de obras y servicios en Venezuela. Analiza este pliego licitatorio y extrae los datos del proyecto y la lista completa de partidas (cuadro de cantidades / presupuesto).

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "procedureNumber": "numero del procedimiento/proceso licitatorio (ej. A-194-26-0031)",
  "projectDescription": "descripcion breve del objeto de la licitacion/obra",
  "contractingEntity": "nombre del ente contratante (ej. PDVSA, alcaldia, ministerio)",
  "partidas": [
    { "code": "codigo de la partida tal como aparece (ej. P-1.01)", "description": "descripcion de la partida", "unit": "unidad de medida (ej. Kg, m2, m3, Act, Und)", "quantity": numero decimal de la cantidad }
  ],
  "confidence": "HIGH" si extrajiste todas las partidas con certeza, "MEDIUM" si algunas partidas son ambiguas o el documento es parcialmente legible, "LOW" si el documento es dificil de interpretar,
  "warnings": ["lista de advertencias, por ejemplo partidas que no se pudieron leer completas, paginas ilegibles, o secciones omitidas, array vacio si todo esta claro"]
}

Extrae TODAS las partidas del cuadro de cantidades/presupuesto, no omitas ninguna. Si el documento tiene multiples secciones o capitulos de partidas, incluye todas. No inventes datos que no aparezcan en el documento.`,
            },
          ],
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      procedureNumber: parsed.procedureNumber ?? "",
      projectDescription: parsed.projectDescription ?? "",
      contractingEntity: parsed.contractingEntity ?? "",
      partidas: Array.isArray(parsed.partidas) ? parsed.partidas : [],
      confidence: parsed.confidence ?? "LOW",
      warnings: parsed.warnings ?? [],
    };
  } catch (error) {
    console.error("[PLIEGO EXTRACTION AGENT ERROR]", error);
    return {
      procedureNumber: "",
      projectDescription: "",
      contractingEntity: "",
      partidas: [],
      confidence: "LOW",
      warnings: ["No se pudo procesar el documento. Completa los datos manualmente o intenta con un PDF de texto (no escaneado como imagen)."],
    };
  }
}