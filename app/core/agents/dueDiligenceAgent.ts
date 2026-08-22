import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RelationshipHistory {
  transactionCount: number;
  totalAmount: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
}

export interface DueDiligenceResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  adverseMediaFindings: string[];
  relationshipAssessment: string;
  recommendation: string;
  sourcesChecked: string[];
}

export async function performDueDiligence(
  entityName: string,
  entityType: "PROVEEDOR" | "CLIENTE",
  history: RelationshipHistory
): Promise<DueDiligenceResult> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search" } as any],
      messages: [
        {
          role: "user",
          content: `Eres un analista de cumplimiento realizando debida diligencia (KYC/KYB) sobre un ${entityType === "PROVEEDOR" ? "proveedor" : "cliente"} nuevo o existente antes de continuar la relacion comercial.

ENTIDAD A INVESTIGAR: ${entityName}

HISTORIAL DE RELACION COMERCIAL REAL (datos propios de la empresa, no inventes nada adicional):
- Numero de transacciones registradas: ${history.transactionCount}
- Monto total historico: $${history.totalAmount.toLocaleString()}
- Primera transaccion: ${history.firstTransactionDate || "N/A (sin historial previo)"}
- Ultima transaccion: ${history.lastTransactionDate || "N/A"}

Busca en internet informacion publica y reciente sobre esta entidad: menciones adversas en prensa (fraude, corrupcion, investigaciones penales, sanciones), o si aparece en alguna lista de sanciones internacional. Busca el nombre tal como fue proporcionado; si el nombre es muy generico y podria corresponder a multiples entidades distintas, indicalo explicitamente en vez de asumir que los resultados corresponden a la entidad correcta.

Responde UNICAMENTE con un JSON valido, sin texto adicional ni markdown, con esta estructura exacta:
{
  "riskLevel": "LOW" o "MEDIUM" o "HIGH",
  "adverseMediaFindings": ["lista de hallazgos negativos reales encontrados en la busqueda, citando la fuente en cada uno, array vacio si no se encontro nada relevante"],
  "relationshipAssessment": "evaluacion breve de la relacion comercial historica basada en los datos reales proporcionados (por ejemplo: relacion nueva sin historial, relacion consistente de largo plazo, patron irregular)",
  "recommendation": "recomendacion profesional breve sobre si proceder, proceder con precaucion, o requerir revision adicional",
  "sourcesChecked": ["breve lista de tipo de fuentes consultadas, ej. 'prensa internacional', 'registros publicos', sin URLs completas"]
}

Se conservador: si el nombre es ambiguo o no encuentras informacion confiable, dilo explicitamente en vez de forzar una conclusion. Un historial de relacion largo y consistente reduce el riesgo; una entidad completamente nueva sin historial no es automaticamente de alto riesgo, solo amerita mayor atencion inicial.`,
        },
      ],
    });

    const textBlock = message.content.filter((block) => block.type === "text").pop();
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      riskLevel: parsed.riskLevel ?? "LOW",
      adverseMediaFindings: parsed.adverseMediaFindings ?? [],
      relationshipAssessment: parsed.relationshipAssessment ?? "",
      recommendation: parsed.recommendation ?? "Revision manual recomendada.",
      sourcesChecked: parsed.sourcesChecked ?? [],
    };
  } catch (error) {
    console.error("[DUE DILIGENCE AGENT ERROR]", error);
    return {
      riskLevel: "LOW",
      adverseMediaFindings: ["No se pudo completar la busqueda automatizada."],
      relationshipAssessment: "",
      recommendation: "Intenta de nuevo o realiza revision manual.",
      sourcesChecked: [],
    };
  }
}