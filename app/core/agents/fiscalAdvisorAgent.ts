import Anthropic from "@anthropic-ai/sdk";
import type { IncomeTaxConfig, LaborCostFormulaConfig, PayrollChargesConfig } from "@/app/lib/jurisdictionTax";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Diferenciador #4: "asesor fiscal multi-jurisdiccion con IA". No inventa
// tasas -- se le pasan EXACTAMENTE los mismos datos que ISLR, FSCL y
// nomina ya usan para calcular (jurisdiction_modules, via los fetch* de
// jurisdictionTax.ts), para que la respuesta quede anclada a lo que el
// sistema tiene configurado para esa empresa, no a lo que el modelo
// "recuerda" de memoria sobre tal o cual pais (que puede estar
// desactualizado o ser directamente incorrecto). Si una jurisdiccion no
// tiene modulo cargado, el prompt le exige decir explicitamente que no
// hay datos cargados en vez de inventar un numero.
export interface FiscalAdvisorContext {
  companyName: string;
  jurisdictionCode: string;
  incomeTaxConfig: IncomeTaxConfig | null;
  laborCostFormulaConfig: LaborCostFormulaConfig | null;
  payrollChargesConfig: PayrollChargesConfig | null;
}

function describeModule(label: string, config: unknown): string {
  if (!config) return label + ": SIN MODULO CARGADO para esta jurisdiccion (no hay datos en jurisdiction_modules).";
  return label + " (configurado para esta jurisdiccion): " + JSON.stringify(config);
}

export async function answerFiscalQuestion(
  context: FiscalAdvisorContext,
  question: string
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Eres un asesor fiscal y laboral para la empresa "${context.companyName}", cuya jurisdiccion configurada en el sistema es "${context.jurisdictionCode}".

REGLAS ESTRICTAS:
1. Para cualquier tasa, tramo o porcentaje, usa UNICAMENTE los datos de jurisdiction_modules listados abajo. Nunca inventes ni completes con tu conocimiento general una tasa que no este en estos datos.
2. Si un modulo dice "SIN MODULO CARGADO", dilo explicitamente al usuario y sugiere que un Admin de la plataforma lo cargue en /admin/jurisdiction-modules (o que consulte a un contador/abogado local para obtener la tasa correcta antes de cargarla) -- no la sustituyas por la de otro pais.
3. Puedes explicar CONCEPTOS generales de fiscalidad/laboral (que es un tramo progresivo, que es una carga patronal, diferencias tipicas entre regimenes) aunque no sean especificos de esta jurisdiccion, siempre dejando claro que es informacion general y no un dato configurado en el sistema.
4. SIEMPRE termina recordando que esto es orientacion informativa generada por IA, no asesoria fiscal/legal vinculante, y que las decisiones que tengan impacto tributario o legal deben confirmarse con un contador publico o abogado habilitado en la jurisdiccion correspondiente antes de actuar.
5. Responde en español, de forma clara y directa, sin relleno.

DATOS CARGADOS EN EL SISTEMA PARA ESTA JURISDICCION (${context.jurisdictionCode}):
${describeModule("Impuesto sobre la Renta (INCOME_TAX)", context.incomeTaxConfig)}
${describeModule("Formula de Costo Laboral / FSCL (LABOR_COST_FORMULA)", context.laborCostFormulaConfig)}
${describeModule("Cargas de Nomina (PAYROLL_CHARGES)", context.payrollChargesConfig)}

PREGUNTA DEL USUARIO: ${question}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("[FISCAL ADVISOR AGENT ERROR]", error);
    return "No se pudo procesar la pregunta en este momento. Intenta de nuevo.";
  }
}