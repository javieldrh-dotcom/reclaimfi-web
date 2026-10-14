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
export const VE_DEFAULT_THIRD_PARTY_CHARGES_PCT: Record<string, number> = {
  seguro_social: 11,
  inces: 2,
  lph: 2,
  paro_forzoso: 2,
};

// Respaldo de nomina (IVSS/INCES/FAOV), mismo patron: si jurisdiction_modules
// no tiene fila PAYROLL_CHARGES para el pais de la empresa, se usan estas
// tasas -- las mismas que ya estaban escritas a mano en
// app/accounting/payroll/page.tsx, asi que ninguna empresa VE existente ve
// un resultado distinto al de antes.
export const VE_DEFAULT_PAYROLL_CHARGES: { employee_pct: Record<string, number>; employer_pct: Record<string, number> } = {
  employee_pct: { ivss_empleado: 4 },
  employer_pct: { ivss_patronal: 9, inces: 2, faov: 2 },
};