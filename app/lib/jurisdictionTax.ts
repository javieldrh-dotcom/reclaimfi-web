// Capa de lectura de jurisdiction_modules (ver migracion
// 2026-10-13-jurisdiction-architecture.sql y el Claude Doc "Globalizar
// ReclaimFi: nucleo universal + modulos por jurisdiccion"). Convierte las
// reglas fiscales/laborales guardadas por pais en funciones de calculo
// genericas, para que ISLR (app/accounting/islr/page.tsx) y FSCL
// (app/lib/apu/fsclMath.ts, app/apu/fscl/page.tsx) dejen de tener la
// formula de Venezuela escrita a mano y lean segun el jurisdiction_code
// de la empresa/proyecto. No cambia nada del motor contable (NIIF/IFRS),
// solo esta capa fiscal/laboral.

export interface IncomeTaxBracket {
  upTo_UT: number | null;
  rate_pct: number;
  sustraendo_UT: number;
}

export interface IncomeTaxConfig {
  name: string;
  unit: string;
  unit_value_required?: boolean;
  brackets: IncomeTaxBracket[];
  [key: string]: unknown;
}

export interface LaborCostFormulaConfig {
  name: string;
  calendar_days_default?: number;
  third_party_charges_pct_of_subtotal_a: Record<string, number>;
  [key: string]: unknown;
}

export interface PayrollChargesConfig {
  name: string;
  employee_pct: Record<string, number>;
  employer_pct: Record<string, number>;
  // Opcional: cantidad minima de empleados activos para que un cargo de
  // employer_pct aplique (ej. INCES en VE solo aplica con 5+
  // trabajadores, Ley INCES art. 49). Se indexa por la misma clave que
  // employer_pct. Un cargo sin entrada aqui siempre aplica.
  employer_pct_min_employees?: Record<string, number>;
  [key: string]: unknown;
}

const FALLBACK_JURISDICTION = "VE";

export async function fetchIncomeTaxConfig(
  supabase: any,
  jurisdictionCode: string | null | undefined
): Promise<IncomeTaxConfig | null> {
  const code = jurisdictionCode || FALLBACK_JURISDICTION;
  const { data } = await supabase
    .from("jurisdiction_modules")
    .select("config")
    .eq("jurisdiction_code", code)
    .eq("module_key", "INCOME_TAX")
    .eq("enabled", true)
    .maybeSingle();
  return (data?.config as IncomeTaxConfig) ?? null;
}

export async function fetchLaborCostFormulaConfig(
  supabase: any,
  jurisdictionCode: string | null | undefined
): Promise<LaborCostFormulaConfig | null> {
  const code = jurisdictionCode || FALLBACK_JURISDICTION;
  const { data } = await supabase
    .from("jurisdiction_modules")
    .select("config")
    .eq("jurisdiction_code", code)
    .eq("module_key", "LABOR_COST_FORMULA")
    .eq("enabled", true)
    .maybeSingle();
  return (data?.config as LaborCostFormulaConfig) ?? null;
}

export async function fetchPayrollChargesConfig(
  supabase: any,
  jurisdictionCode: string | null | undefined
): Promise<PayrollChargesConfig | null> {
  const code = jurisdictionCode || FALLBACK_JURISDICTION;
  const { data } = await supabase
    .from("jurisdiction_modules")
    .select("config")
    .eq("jurisdiction_code", code)
    .eq("module_key", "PAYROLL_CHARGES")
    .eq("enabled", true)
    .maybeSingle();
  return (data?.config as PayrollChargesConfig) ?? null;
}

// Formula progresiva por tramos, generica. Reemplaza calculateTarifa2()
// (que solo conocia los 3 tramos venezolanos de Tarifa 2 escritos a
// mano). Un pais de tasa plana es simplemente un solo bracket con
// upTo_UT: null -- la misma funcion sirve para ambos casos.
export function calculateBracketTax(
  taxableBase: number,
  config: IncomeTaxConfig,
  unitValue: number
): { baseInUnits: number; rate: number; sustraendo: number; tax: number } {
  const requiresUnit = config.unit_value_required !== false;
  const uv = requiresUnit ? unitValue || 1 : 1;
  const baseInUnits = taxableBase / uv;

  const sorted = [...config.brackets].sort((a, b) => {
    if (a.upTo_UT === null) return 1;
    if (b.upTo_UT === null) return -1;
    return a.upTo_UT - b.upTo_UT;
  });
  const bracket =
    sorted.find((b) => b.upTo_UT !== null && baseInUnits <= b.upTo_UT) ??
    sorted[sorted.length - 1];

  const sustraendo = bracket?.sustraendo_UT || 0;
  const rate = bracket?.rate_pct || 0;
  const taxInUnits = (baseInUnits * rate) / 100 - sustraendo;
  const tax = taxInUnits * uv;

  return { baseInUnits, rate, sustraendo, tax };
}

// Reemplaza los 4 porcentajes fijos (11% SSO + 2% INCES + 2% LPH + 2%
// Paro Forzoso) escritos a mano en fsclMath.ts y en
// app/apu/fscl/page.tsx -- cada pais aporta su propio mapa de cargas
// sobre Sub Total A en vez de depender del regimen venezolano (CCTP).
export function applyThirdPartyCharges(
  subTotalA: number,
  chargesPct: Record<string, number>
): { charges: Record<string, number>; subTotalTerceros: number } {
  const charges: Record<string, number> = {};
  let subTotalTerceros = 0;
  for (const [key, pct] of Object.entries(chargesPct || {})) {
    const amount = subTotalA * (pct / 100);
    charges[key] = amount;
    subTotalTerceros += amount;
  }
  return { charges, subTotalTerceros };
}

// Valores por defecto de Venezuela (CCTP), usados como respaldo cuando
// jurisdiction_modules todavia no tiene fila para el pais de la empresa
// -- asi ninguna empresa existente ve un factor FSCL distinto al de hoy
// si por algun motivo la consulta a jurisdiction_modules no trae datos.
//
// Verificado contra fuente legal (14-oct-2026): estos 4 montos son
// EXCLUSIVAMENTE la carga patronal (lo que paga la empresa, no lo que se
// le retiene al trabajador) de cada regimen, sumados:
// - seguro_social 11%: el aporte patronal de IVSS varia 9/10/11% segun
//   la clasificacion de riesgo de la actividad (Minimo/Medio/Maximo --
//   Decreto 8.921, Reglamento Ley SS art. 192). 11% corresponde a
//   Riesgo Maximo, que es la clasificacion esperada para la actividad de
//   perforacion/extraccion/petroquimica que licita con PDVSA (contexto
//   de este modulo APU) -- si FSCL se usa para un contratista de otra
//   actividad con riesgo Minimo o Medio, el porcentaje correcto es 9% o
//   10%, no 11%. Editable por jurisdiccion/proyecto en
//   /admin/jurisdiction-modules.
// - inces 2%: aporte patronal, aplica solo si la entidad de trabajo tiene
//   5 o mas trabajadores (Ley INCES, Gaceta 6.155 Extraordinario, art.
//   49). FSCL no conoce la nomina real del contratista licitante (es un
//   factor de costeo, no un calculo de nomina), asi que asume que aplica
//   -- razonable para una empresa que licita una obra de magnitud
//   suficiente para requerir FSCL, pero queda como supuesto a confirmar
//   caso por caso.
// - lph 2%: aporte patronal al FAOV (Ley de Vivienda y Habitat,
//   BANAVIH). El trabajador aporta 1% adicional, pero eso es una
//   retencion sobre SU salario, no un costo para el contratista, por eso
//   no se incluye aqui.
// - paro_forzoso 2%: aporte patronal al Regimen Prestacional de Empleo
//   (Ley del RPE, Gaceta 38.281, art. 46). El trabajador aporta 0.5%
//   adicional (retencion, no costo patronal), tampoco se incluye aqui.
export const VE_DEFAULT_THIRD_PARTY_CHARGES_PCT: Record<string, number> = {
  seguro_social: 11,
  inces: 2,
  lph: 2,
  paro_forzoso: 2,
};

// Respaldo de nomina (IVSS/INCES/LPH/Paro Forzoso). Corregido el
// 14-oct-2026 contra fuente legal: la version anterior (antes de esta
// correccion) solo tenia IVSS 4% retenido al empleado y 9%+2%+2%
// patronal -- le faltaban por completo las retenciones de LPH (1%) y
// Paro Forzoso (0.5%) al empleado, y el aporte patronal de Paro
// Forzoso/RPE (2%). Esto SI cambia el monto neto pagado y las
// obligaciones patronales de cualquier empresa VE que corra nomina
// desde este cambio en adelante -- a diferencia de las correcciones
// anteriores de esta sesion, que preservaban el comportamiento
// existente a proposito. Fuentes:
// - ivss_empleado 4%: retencion al trabajador, sin cambios.
// - ivss_patronal 9%: aporte patronal de IVSS en Riesgo Minimo (el
//   supuesto mas conservador cuando no se conoce la clasificacion real
//   de riesgo de la empresa -- puede ser 10% o 11% si la actividad es
//   de riesgo Medio o Maximo; Decreto 8.921, Reglamento Ley SS art. 192).
// - inces 2%: aporte patronal, aplica solo si la empresa tiene 5 o mas
//   trabajadores activos (Ley INCES, Gaceta 6.155, art. 49) -- a
//   diferencia de FSCL, aqui SI se conoce la nomina real, asi que
//   app/accounting/payroll/page.tsx excluye este cargo cuando hay menos
//   de 5 empleados activos en vez de asumir que siempre aplica.
// - faov 2% (patronal) + lph_empleado 1% (retencion): Ley de Vivienda y
//   Habitat / BANAVIH.
// - paro_forzoso_patronal 2% + paro_forzoso_empleado 0.5%: Ley del
//   Regimen Prestacional de Empleo, Gaceta 38.281, art. 46.
export const VE_DEFAULT_PAYROLL_CHARGES: PayrollChargesConfig = {
  name: "Cargas de Nomina Venezuela (IVSS/INCES/LPH-FAOV/Paro Forzoso-RPE)",
  employee_pct: { ivss_empleado: 4, lph_empleado: 1, paro_forzoso_empleado: 0.5 },
  employer_pct: { ivss_patronal: 9, inces: 2, faov: 2, paro_forzoso_patronal: 2 },
  employer_pct_min_employees: { inces: 5 },
};

// Aplica employer_pct_min_employees: quita del mapa de cargas patronales
// cualquier cargo cuyo minimo de empleados activos no se cumpla (ej.
// INCES con menos de 5 empleados en VE). Generico por jurisdiccion --
// app/accounting/payroll/page.tsx llama esto en vez de leer
// employer_pct directo, para que la regla viva en el dato
// (jurisdiction_modules), no en el codigo de la pantalla.
export function filterEmployerChargesByHeadcount(
  config: PayrollChargesConfig,
  activeEmployeeCount: number
): Record<string, number> {
  const minByKey = config.employer_pct_min_employees ?? {};
  const filtered: Record<string, number> = {};
  for (const [key, pct] of Object.entries(config.employer_pct || {})) {
    const minRequired = minByKey[key];
    if (minRequired !== undefined && activeEmployeeCount < minRequired) continue;
    filtered[key] = pct;
  }
  return filtered;
}