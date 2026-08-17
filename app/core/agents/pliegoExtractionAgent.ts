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

const SINGLE_DOC_PROMPT = `Eres un asistente especializado en licitaciones de obras y servicios en Venezuela. Analiza este documento, que es parte (o la totalidad) de un pliego licitatorio, y extrae los datos del proyecto y las partidas (cuadro de cantidades / presupuesto) que aparezcan en ESTE documento especifico. Es posible que este documento no contenga todos los datos (por ejemplo, solo el cuadro de partidas sin la caratula del proyecto) - en ese caso deja esos campos vacios.

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "procedureNumber": "numero del procedimiento/proceso licitatorio si aparece en este documento, sino vacio",
  "projectDescription": "descripcion breve del objeto de la licitacion/obra si aparece, sino vacio",
  "contractingEntity": "nombre del ente contratante si aparece, sino vacio",
  "partidas": [
    { "code": "codigo de la partida tal como aparece (ej. P-1.01)", "description": "descripcion de la partida", "unit": "unidad de medida (ej. Kg, m2, m3, Act, Und)", "quantity": numero decimal de la cantidad }
  ],
  "confidence": "HIGH" si extrajiste todo con certeza, "MEDIUM" si algo es ambiguo o el documento es parcialmente legible, "LOW" si el documento es dificil de interpretar,
  "warnings": ["lista de advertencias, array vacio si todo esta claro"]
}

Extrae TODAS las partidas que aparezcan en este documento. No inventes datos que no aparezcan en el.`;

async function extractSingleDocument(base64Pdf: string): Promise<ExtractedPliegoData> {
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
              source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
            },
            { type: "text", text: SINGLE_DOC_PROMPT },
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
  } catch (error: any) {
    const detail = error?.message || error?.error?.message || String(error);
    return {
      procedureNumber: "",
      projectDescription: "",
      contractingEntity: "",
      partidas: [],
      confidence: "LOW",
      warnings: ["Error en uno de los documentos: " + detail],
    };
  }
}

export async function extractPliegoData(base64Pdfs: string[]): Promise<ExtractedPliegoData> {
  // Analiza cada documento por separado (evita el limite de 100 paginas/32MB por solicitud
  // combinada de Claude) y luego combina los resultados.
  const results = await Promise.all(base64Pdfs.map((b64) => extractSingleDocument(b64)));

  const combined: ExtractedPliegoData = {
    procedureNumber: "",
    projectDescription: "",
    contractingEntity: "",
    partidas: [],
    confidence: "HIGH",
    warnings: [],
  };

  const confidenceRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  let worstConfidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";

  for (const r of results) {
    if (!combined.procedureNumber && r.procedureNumber) combined.procedureNumber = r.procedureNumber;
    if (!combined.projectDescription && r.projectDescription) combined.projectDescription = r.projectDescription;
    if (!combined.contractingEntity && r.contractingEntity) combined.contractingEntity = r.contractingEntity;
    combined.partidas.push(...r.partidas);
    combined.warnings.push(...r.warnings);
    if (confidenceRank[r.confidence] < confidenceRank[worstConfidence]) worstConfidence = r.confidence;
  }
  combined.confidence = worstConfidence;

  // Elimina partidas duplicadas si el mismo codigo aparece en mas de un documento
  const seen = new Set<string>();
  combined.partidas = combined.partidas.filter((p) => {
    const key = (p.code || "") + "|" + p.description;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return combined;
}