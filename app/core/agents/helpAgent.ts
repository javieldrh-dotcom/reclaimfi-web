import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PLATFORM_KNOWLEDGE = `
La plataforma Audit Global Intelligence tiene 3 modulos principales:

MODULO DE CONTABILIDAD:
- Libro Diario (/accounting/journal): registro cronologico de asientos contables
- Libro Mayor (/accounting/general-ledger): asientos clasificados por cuenta
- Inventario de Mercancia (/accounting/inventory) y Libro de Inventario Legal (/accounting/inventory-book)
- Balance de Comprobacion (/accounting/trial-balance): verifica que Debe = Haber
- Estados Financieros: Situacion Financiera, Estado de Resultados, Flujo de Efectivo, Variacion de Patrimonio
- Cuentas por Cobrar (/accounting/ar-invoices) y Cuentas por Pagar (/accounting/ap-bills)
- Activos Fijos (/accounting/fixed-assets), Nomina (/accounting/payroll)
- Conciliacion Bancaria (/accounting/bank-reconciliation)
- Fiscal: Libro de Ventas, Libro de Compras, Resumen de IVA, Resumen de Retenciones, IGTF, ISLR Anual, ISLR Estimado, Impuesto Diferido
- Reexpresion por Inflacion NIC 29 (/accounting/hyperinflation): ajusta los 4 estados financieros por inflacion
- Libro Verificable por Blockchain (/accounting/blockchain-ledger): cadena criptografica de los asientos
- Cierre de Ejercicio (/accounting/period-close)
- Recursos para Contadores (/accounting/resources): guias y plantillas descargables

MODULO APU / LICITACIONES:
- Analisis de precios unitarios para procesos de contratacion publica
- Catalogo de clasificacion oficial y motor de costo laboral

MODULO DE AUDITORIA FORENSE (ReclaimFi):
- Investigacion de evidencia digital con cadena de custodia verificable

Instrucciones para responder:
- Responde en español, breve y directo, maximo 4-5 lineas
- Si la pregunta es sobre como usar una funcionalidad, indica el nombre exacto de la pagina y donde encontrarla en el menu
- Si la pregunta no esta relacionada con el uso de la plataforma, indica amablemente que este asistente es solo para orientacion de funcionalidades, no para consultas de datos contables (esas van en la pestana "Mis Datos")
- No inventes funcionalidades que no existen en la lista de arriba
`;

export async function answerHelpQuestion(question: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: PLATFORM_KNOWLEDGE + "\n\nPREGUNTA DEL USUARIO: " + question,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("[HELP AGENT ERROR]", error);
    return "No se pudo procesar la pregunta en este momento. Intenta de nuevo.";
  }
}