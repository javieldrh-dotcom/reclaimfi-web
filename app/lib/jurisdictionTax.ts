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

// Un concepto del recibo de pago: el codigo interno del pais (ej. "152"
// en VE para IVSS) y el nombre tal como aparece en el recibo. Permite
// que cada jurisdiccion use su propia numeracion/nombre oficial en vez
// de los codigos venezolanos.
export interface PayrollConceptLabel {
  code: string;
  label: string;
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
  // Multiplicadores para horas extra y dias feriados/descanso
  // trabajados -- varian por legislacion laboral de cada pais. VE usa
  // LOTTT (recargo 50% diurno, 50%+30% nocturno, pago doble feriado).
  // Si una jurisdiccion no trae esto, se usan los valores VE de
  // VE_DEFAULT_PAYROLL_CHARGES como respaldo (campo por campo, no el
  // objeto completo, para no perder esto si el config guardado es de
  // antes de que este campo existiera).
  overtime_rules?: {
    extra_diurna_multiplier?: number;
    extra_nocturna_multiplier?: number;
    feriado_descanso_multiplier?: number;
  };
  // Nombres y codigos localizados para el recibo de pago. "CEDULA" en
  // Venezuela/Colombia, "CURP" en Mexico, "DNI/NIE" en Espana, "SSN" en
  // EEUU, etc. "concepts" trae el codigo/nombre oficial de cada rubro
  // que no viene de employee_pct/employer_pct (salario base, horas
  // extra, feriados trabajados, faltas, impuesto a la renta).
  // "deduction_codes" trae el codigo/nombre de cada clave de
  // employee_pct (ej. ivss_empleado -> "152 Seguro Social Obligatorio"
  // en VE). Todo opcional -- sin esto, el recibo usa los valores VE por
  // defecto, igual que siempre.
  labels?: {
    id_document?: string;
    // Nombre del identificador fiscal de la EMPRESA en el encabezado del
    // recibo -- "RIF" en Venezuela, "RFC" en Mexico, "EIN"/"Tax ID" en
    // EEUU. Antes el recibo imprimia "RIF:" fijo sin importar el pais.
    tax_id_label?: string;
    // Identificadores ADICIONALES del trabajador, ademas de
    // id_document/employeeCedula. Mexico necesita 3 (RFC + CURP + NSS),
    // no solo uno -- id_document sigue siendo el documento "principal"
    // (CURP en Mexico, va en la firma del recibo); extra_employee_ids
    // son los demas, guardados en employees.extra_ids por la clave en
    // "code" (ej. code:"rfc" -> employees.extra_ids.rfc).
    extra_employee_ids?: PayrollConceptLabel[];
    concepts?: {
      base_salary?: PayrollConceptLabel;
      overtime_day?: PayrollConceptLabel;
      overtime_night?: PayrollConceptLabel;
      holiday_worked?: PayrollConceptLabel;
      absence?: PayrollConceptLabel;
      income_tax?: PayrollConceptLabel;
    };
    deduction_codes?: Record<string, PayrollConceptLabel>;
  };
  [key: string]: unknown;
}

// "VAT_CREDIT": impuesto al valor agregado con credito/debito fiscal
// (VE y la mayoria de LatAm) -- app/accounting/vat-summary/page.tsx NO
// cambia su calculo de casillas para este modelo (ya es correcto y es
// el unico usado hoy), solo lee form_label/name de aqui para mostrar un
// titulo distinto por jurisdiccion si se carga una fila non-VE con este
// modelo.
// "FLAT_SALES_TAX": impuesto de venta de una sola etapa, sin credito
// fiscal (ej. sales tax estadal en EEUU) -- usa un resumen distinto
// (ventas gravables x tasa = impuesto recaudado), ver calculateFlatSalesTax.
export interface SalesTaxConfig {
  name: string;
  model: "VAT_CREDIT" | "FLAT_SALES_TAX";
  rate_pct?: number;
  form_label?: string;
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

// Nombre de cuenta contable legible para una clave de carga patronal
// (ej. "imss_patronal" -> "IMSS PATRONAL"). Unica fuente de este
// formato -- app/accounting/payroll/page.tsx usa las mismas palabras
// para FILTRAR el selector de cuentas (split por "_"), y
// app/admin/companies/new/page.tsx usa esta funcion para GENERAR el
// nombre de la cuenta en si, asi los dos lados siempre coinciden.
export function humanizeChargeKey(key: string): string {
  return key.replace(/_/g, " ").toUpperCase();
}

export interface PayrollAccountPlanEntry {
  key: string;
  expenseName: string;
  payableName: string;
}

// Plan de cuentas contables de nomina especifico de una jurisdiccion:
// una pareja gasto/pasivo por cada carga PATRONAL (ej. IMSS PATRONAL +
// INFONAVIT en Mexico, CPP Patronal + EI Patronal en Canada, FICA +
// FUTA en EEUU). Usado por app/admin/companies/new/page.tsx para
// instalar estas cuentas automaticamente al crear una empresa -- antes
// de esto, cada contador tenia que crear estas cuentas a mano con
// "+ Nueva" por cada empresa nueva en cada pais, lo cual no escala a
// centenares de contadores. No incluye las cargas al EMPLEADO: esas se
// llevan en una sola cuenta "Retenciones al Empleado por Pagar"
// consolidada (decision de Javiel), generica y ya presente en la
// plantilla universal, no requiere generarse por jurisdiccion.
export function buildPayrollAccountPlan(charges: PayrollChargesConfig): PayrollAccountPlanEntry[] {
  return Object.keys(charges.employer_pct || {}).map((key) => {
    const label = humanizeChargeKey(key);
    return { key, expenseName: "Gasto " + label, payableName: label + " por Pagar" };
  });
}

export async function fetchSalesTaxConfig(
  supabase: any,
  jurisdictionCode: string | null | undefined
): Promise<SalesTaxConfig> {
  const code = jurisdictionCode || FALLBACK_JURISDICTION;
  const { data } = await supabase
    .from("jurisdiction_modules")
    .select("config")
    .eq("jurisdiction_code", code)
    .eq("module_key", "SALES_TAX")
    .eq("enabled", true)
    .maybeSingle();
  return (data?.config as SalesTaxConfig) ?? VE_DEFAULT_SALES_TAX;
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
  overtime_rules: {
    extra_diurna_multiplier: 1.5,
    extra_nocturna_multiplier: 1.95,
    feriado_descanso_multiplier: 2,
  },
  labels: {
    id_document: "CEDULA",
    tax_id_label: "RIF",
    concepts: {
      base_salary: { code: "001", label: "Salario Basico por dias trabajados" },
      overtime_day: { code: "002", label: "Horas Extras Diurnas Autorizadas" },
      overtime_night: { code: "004", label: "Horas Extras Nocturnas Autorizadas" },
      holiday_worked: { code: "009", label: "Dias de Descanso y Feriados Trabajados" },
      absence: { code: "101", label: "Dias de Faltas al Trabajo" },
      income_tax: { code: "151", label: "Impuesto Sobre la Renta (I.S.L.R.)" },
    },
    deduction_codes: {
      ivss_empleado: { code: "152", label: "Seguro Social Obligatorio" },
      paro_forzoso_empleado: { code: "153", label: "Regimen Prestacional del Empleo" },
      lph_empleado: { code: "154", label: "Fondo de Ahorro Obligatorio para la Vivienda" },
    },
  },
};

// Ejemplos de referencia para otras jurisdicciones -- NO se cargan
// automaticamente ni se insertan por SQL. Son plantillas de partida que
// Javiel (como CPA) debe verificar contra fuente legal vigente antes de
// activarlas para una empresa real, exactamente igual que el supuesto
// documentado arriba para VE (riesgo IVSS Minimo/Medio/Maximo). Cubren,
// a modo de muestra por region, uno o mas paises con informacion
// fiscal/laboral razonablemente estable y publica: Norteamerica (EEUU,
// Canada, Mexico), Centroamerica (Costa Rica), Suramerica (Colombia), el
// Caribe (Rep. Dominicana), Europa (Espana), Africa (Sudafrica), Asia
// mayor (India), Asia menor / Medio Oriente (Turquia), Oceania
// (Australia). No es una lista exhaustiva de los ~190 paises del mundo
// -- cada tasa cambia con frecuencia y con la ley local vigente, asi que
// inventar cifras para todos los paises sin fuente verificada seria
// irresponsable. El patron para agregar cualquier otro pais es el
// mismo: una fila en jurisdiction_modules con esta forma, cargada desde
// /admin/jurisdiction-modules.
export const PAYROLL_CHARGES_REFERENCE_EXAMPLES: Record<string, PayrollChargesConfig> = {
  US: {
    name: "Payroll Taxes USA (FICA federal -- verificar estado/condado, que agregan impuestos propios)",
    employee_pct: { social_security_empleado: 6.2, medicare_empleado: 1.45 },
    employer_pct: { social_security_patronal: 6.2, medicare_patronal: 1.45, futa: 0.6 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 1.5, feriado_descanso_multiplier: 1 },
    labels: {
      id_document: "SSN",
      tax_id_label: "EIN",
      concepts: {
        base_salary: { code: "REG", label: "Regular Wages" },
        overtime_day: { code: "OT", label: "Overtime (1.5x)" },
        holiday_worked: { code: "HOL", label: "Holiday Pay" },
        absence: { code: "UNP", label: "Unpaid Absence" },
        income_tax: { code: "FIT", label: "Federal Income Tax Withholding" },
      },
      deduction_codes: {
        social_security_empleado: { code: "SS", label: "Social Security (FICA)" },
        medicare_empleado: { code: "MED", label: "Medicare (FICA)" },
      },
    },
  },
  CA: {
    // CPP/EI son tasas federales base (primer tramo de CPP, sin CPP2
    // para ingresos altos). El impuesto a la renta combina retencion
    // federal + provincial, que varia por provincia -- aqui se deja como
    // un solo concepto generico "income_tax", no desglosado por
    // provincia. Horas extra: la regla general federal es 1.5x despues
    // de 44h/semana, pero cada provincia tiene su propio umbral.
    name: "Payroll Deductions Canada (CPP/EI federal -- verificar provincia, que agrega impuesto propio)",
    employee_pct: { cpp_empleado: 5.95, ei_empleado: 1.66 },
    employer_pct: { cpp_patronal: 5.95, ei_patronal: 2.32 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 1.5, feriado_descanso_multiplier: 1.5 },
    labels: {
      id_document: "SIN",
      tax_id_label: "Business Number (BN)",
      concepts: {
        base_salary: { code: "REG", label: "Regular Earnings" },
        overtime_day: { code: "OT", label: "Overtime (1.5x)" },
        holiday_worked: { code: "STAT", label: "Statutory Holiday Pay" },
        absence: { code: "UNP", label: "Unpaid Leave" },
        income_tax: { code: "TAX", label: "Federal/Provincial Income Tax Withholding" },
      },
      deduction_codes: {
        cpp_empleado: { code: "CPP", label: "Canada Pension Plan (CPP)" },
        ei_empleado: { code: "EI", label: "Employment Insurance (EI)" },
      },
    },
  },
  MX: {
    // El IMSS se compone de varias ramas (enfermedad y maternidad,
    // invalidez y vida, retiro-cesantia-vejez, guarderias, riesgo de
    // trabajo) cuyo porcentaje combinado varia segun el salario base de
    // cotizacion y la clase de riesgo de la empresa -- las cifras aqui
    // son un aproximado comun citado para riesgo bajo, NO una tabla
    // completa por rama. INFONAVIT (vivienda) es 5% patronal aparte.
    // Horas extra (LFT): las primeras 9 horas extra por semana se pagan
    // al doble, el exceso al triple -- este modelo solo soporta UN
    // multiplicador por tipo, asi que overtime_rules usa 2x (el tramo
    // mas comun); el tramo triple no esta modelado todavia.
    name: "Cuotas IMSS/INFONAVIT Mexico (aproximado, riesgo bajo -- verificar clase de riesgo y salario base de cotizacion)",
    employee_pct: { imss_empleado: 2.375 },
    employer_pct: { imss_patronal: 20.4, infonavit: 5 },
    overtime_rules: { extra_diurna_multiplier: 2, extra_nocturna_multiplier: 2, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "CURP",
      tax_id_label: "RFC",
      // Mexico identifica al trabajador con 3 documentos (RFC, CURP,
      // NSS), no solo uno -- CURP queda como id_document (el que va en
      // la firma del recibo, igual patron que CEDULA en VE), RFC y NSS
      // se agregan aqui como campos extra (ver employees.extra_ids).
      extra_employee_ids: [
        { code: "rfc", label: "RFC" },
        { code: "nss", label: "NSS" },
      ],
      concepts: {
        base_salary: { code: "001", label: "Sueldo Base" },
        overtime_day: { code: "019", label: "Horas Extra Dobles" },
        holiday_worked: { code: "020", label: "Dias de Descanso Trabajados" },
        absence: { code: "-", label: "Faltas" },
        income_tax: { code: "002", label: "ISR (Impuesto Sobre la Renta)" },
      },
      deduction_codes: {
        imss_empleado: { code: "-", label: "Instituto Mexicano del Seguro Social (IMSS)" },
      },
    },
  },
  CR: {
    name: "Cargas Sociales Costa Rica (CCSS)",
    employee_pct: { ccss_empleado: 10.67 },
    employer_pct: { ccss_patronal: 26.17 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 1.5, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "CEDULA",
      tax_id_label: "Cedula Juridica",
      concepts: { income_tax: { code: "-", label: "Impuesto sobre la Renta (CR)" } },
      deduction_codes: { ccss_empleado: { code: "-", label: "Caja Costarricense de Seguro Social" } },
    },
  },
  CO: {
    name: "Aportes de Nomina Colombia",
    employee_pct: { salud_empleado: 4, pension_empleado: 4 },
    employer_pct: { salud_patronal: 8.5, pension_patronal: 12, arl: 0.522, caja_compensacion: 4, icbf: 3, sena: 2 },
    overtime_rules: { extra_diurna_multiplier: 1.25, extra_nocturna_multiplier: 1.75, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "CEDULA",
      tax_id_label: "NIT",
      concepts: { income_tax: { code: "-", label: "Retencion en la Fuente" } },
      deduction_codes: {
        salud_empleado: { code: "-", label: "Salud (EPS)" },
        pension_empleado: { code: "-", label: "Pension (AFP)" },
      },
    },
  },
  DO: {
    name: "Cargas de Nomina Republica Dominicana (TSS)",
    employee_pct: { sfs_empleado: 3.04, afp_empleado: 2.87 },
    employer_pct: { sfs_patronal: 7.09, afp_patronal: 7.1, infotep: 1 },
    overtime_rules: { extra_diurna_multiplier: 1.35, extra_nocturna_multiplier: 1.35, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "CEDULA",
      tax_id_label: "RNC",
      concepts: { income_tax: { code: "-", label: "Impuesto Sobre la Renta (ISR)" } },
      deduction_codes: {
        sfs_empleado: { code: "-", label: "Seguro Familiar de Salud (SFS)" },
        afp_empleado: { code: "-", label: "Administradora de Fondos de Pensiones (AFP)" },
      },
    },
  },
  ES: {
    name: "Cotizaciones a la Seguridad Social Espana",
    employee_pct: { seguridad_social_empleado: 6.35 },
    employer_pct: { seguridad_social_patronal: 29.9, desempleo_patronal: 5.5, fogasa: 0.2, formacion_profesional: 0.6 },
    overtime_rules: { extra_diurna_multiplier: 1.75, extra_nocturna_multiplier: 1.75, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "DNI/NIE",
      tax_id_label: "CIF/NIF",
      concepts: { income_tax: { code: "-", label: "Retencion IRPF" } },
      deduction_codes: { seguridad_social_empleado: { code: "-", label: "Seguridad Social (cuota obrera)" } },
    },
  },
  ZA: {
    name: "Payroll Contributions South Africa (UIF)",
    employee_pct: { uif_empleado: 1 },
    employer_pct: { uif_patronal: 1, sdl: 1 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 1.5, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "ID Number",
      tax_id_label: "Company Registration Number",
      concepts: { income_tax: { code: "-", label: "PAYE (Pay As You Earn)" } },
      deduction_codes: { uif_empleado: { code: "-", label: "Unemployment Insurance Fund (UIF)" } },
    },
  },
  IN: {
    name: "Payroll Contributions India (PF/ESI)",
    employee_pct: { epf_empleado: 12, esi_empleado: 0.75 },
    employer_pct: { epf_patronal: 12, esi_patronal: 3.25 },
    overtime_rules: { extra_diurna_multiplier: 2, extra_nocturna_multiplier: 2, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "Aadhaar/PAN",
      tax_id_label: "GSTIN",
      concepts: { income_tax: { code: "-", label: "TDS (Tax Deducted at Source)" } },
      deduction_codes: {
        epf_empleado: { code: "-", label: "Employees Provident Fund (EPF)" },
        esi_empleado: { code: "-", label: "Employees State Insurance (ESI)" },
      },
    },
  },
  TR: {
    name: "Primas SGK Turquia",
    employee_pct: { sgk_empleado: 14, issizlik_empleado: 1 },
    employer_pct: { sgk_patronal: 20.5, issizlik_patronal: 2 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 1.5, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "T.C. Kimlik No.",
      tax_id_label: "Vergi Numarasi",
      concepts: { income_tax: { code: "-", label: "Gelir Vergisi (Retencion de Renta)" } },
      deduction_codes: { sgk_empleado: { code: "-", label: "Sosyal Guvenlik Kurumu (SGK)" } },
    },
  },
  AU: {
    name: "Superannuation & PAYG Australia",
    employee_pct: {},
    employer_pct: { superannuation_patronal: 11.5 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 2, feriado_descanso_multiplier: 2.5 },
    labels: {
      id_document: "TFN (Tax File Number)",
      tax_id_label: "ABN (Australian Business Number)",
      concepts: { income_tax: { code: "-", label: "PAYG Withholding" } },
      deduction_codes: {},
    },
  },
};

// Aplica employer_pct_min_employees: quita del mapa de cargas patronales
// cualquier cargo cuyo minimo de empleados activos no se cumpla (ej.
// INCES con menos de 5 empleados en VE). Generico por jurisdiccion --
// app/accounting/payroll/page.tsx llama esto en vez de leer
// employer_pct directo, para que la regla viva en el dato
// (jurisdiction_modules), no en el codigo de la pantalla.
// Respaldo de IVA Venezuela: model VAT_CREDIT (credito/debito fiscal
// SENIAT), lo que ya hace vat-summary/page.tsx hoy sin ningun cambio de
// comportamiento. form_label reproduce el subtitulo que ya se muestra
// hardcodeado en esa pantalla.
export const VE_DEFAULT_SALES_TAX: SalesTaxConfig = {
  name: "IVA Venezuela (SENIAT)",
  model: "VAT_CREDIT",
  rate_pct: 16,
  form_label: "Forma IVA 99030 - Casillas oficiales SENIAT",
};

// Resumen de impuesto de venta de una sola etapa (sin credito fiscal):
// el impuesto recaudado en ventas gravables ES el impuesto a remitir,
// sin restar ningun "credito" por compras (a diferencia de VAT_CREDIT).
// No reemplaza el formulario oficial de ningun estado/pais -- es un
// resumen informativo para que el contador verifique contra el
// formulario real antes de declarar (igual espiritu que el boton
// "verificar consistencia" del modelo VAT_CREDIT).
export function calculateFlatSalesTax(
  taxableSales: number,
  exemptSales: number,
  taxCollected: number
): { taxableSales: number; exemptSales: number; totalSales: number; taxCollected: number; taxDue: number } {
  return {
    taxableSales,
    exemptSales,
    totalSales: taxableSales + exemptSales,
    taxCollected,
    taxDue: taxCollected,
  };
}

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
