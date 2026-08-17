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

export async function extractPliegoData(base64Pdfs: string[]): Promise<ExtractedPliegoData> {
  try {
    const documentBlocks = base64Pdfs.map((b64) => ({
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data: b64,
      },
    }));

    const instructionText = {
      type: "text" as const,
      text: `Eres un asistente especializado en licitaciones de obras y servicios en Venezuela. Te adjunte ${base64Pdfs.length} documento(s) que en conjunto forman el pliego licitatorio completo (puede incluir pliego principal, anexos tecnicos, y/o cuadro de cantidades por separado). Analiza TODOS los documentos en conjunto y extrae los datos del proyecto y la lista completa de partidas (cuadro de cantidades / presupuesto), combinando informacion de todos los archivos segun corresponda.

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "procedureNumber": "numero del procedimiento/proceso licitatorio (ej. A-194-26-0031)",
  "projectDescription": "descripcion breve del objeto de la licitacion/obra",
  "contractingEntity": "nombre del ente contratante (ej. PDVSA, alcaldia, ministerio)",
  "partidas": [
    { "code": "codigo de la partida tal como aparece (ej. P-1.01)", "description": "descripcion de la partida", "unit": "unidad de medida (ej. Kg, m2, m3, Act, Und)", "quantity": numero decimal de la cantidad }
  ],
  "confidence": "HIGH" si extrajiste todas las partidas con certeza, "MEDIUM" si algunas partidas son ambiguas o los documentos son parcialmente legibles, "LOW" si los documentos son dificiles de interpretar,
  "warnings": ["lista de advertencias, por ejemplo partidas que no se pudieron leer completas, paginas ilegibles, secciones omitidas, o informacion contradictoria entre documentos, array vacio si todo esta claro"]
}

Extrae TODAS las partidas de todos los documentos, no omitas ninguna ni las repitas si aparecen en mas de un archivo. Si el numero de procedimiento o descripcion aparece en un documento pero no en otro, usa el que si lo tenga. No inventes datos que no aparezcan en los documentos.`,
    };

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [...documentBlocks, instructionText],
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
      warnings: ["No se pudo procesar los documentos. Completa los datos manualmente o intenta con PDFs de texto (no escaneados como imagen)."],
    };
  }
}