// Calculo del Factor Sobre Costo de Labor (FSCL), originalmente solo bajo
// el Contrato Colectivo Petrolero (CCTP) de Venezuela, extraido de
// app/apu/fscl/page.tsx para poder probarlo sin React ni Supabase -- mismo
// patron que app/lib/forensics/* (Fase 3) y app/lib/reportHash.ts (Fase 4).
//
// Globalizado (ver app/lib/jurisdictionTax.ts y el Claude Doc "Globalizar
// ReclaimFi"): el cuarto parametro opcional recibe los porcentajes de
// "pagos a terceros" (seguro social, etc.) de CUALQUIER pais, leidos de
// jurisdiction_modules. Si se omite, usa los valores venezolanos de
// siempre (11% SSO + 2% INCES + 2% LPH + 2% Paro Forzoso) -- por eso los
// tests existentes, que no pasan este parametro, siguen pasando sin
// cambios.
// Import relativo (no "@/...") porque vitest.config.ts no tiene
// configurado el alias "@/" -- ver el mismo patron en el resto de
// app/lib/apu/*.
import { applyThirdPartyCharges, VE_DEFAULT_THIRD_PARTY_CHARGES_PCT } from "../jurisdictionTax";

export interface FsclInput {
  dailyBasicSalary: number;
  calendarDays: number; // tipicamente 365
  nonWorkedDays: number; // dias no laborados segun el sistema de trabajo
  isaPercentage: number; // % sobre el salario basico
  travelTimeAmount: number;
  preavisoDays: number;
  antiguedadLegalDays: number;
  antiguedadContractualDays: number;
  vacacionesDays: number;
  bonoVacacionalDays: number;
  utilidadesDays: number;
  eppAmount: number;
  aguaHieloAmount: number;
  clinicaAmount: number;
}

export interface FsclResult {
  worked: number;
  subTotalA: number;
  subTotalB: number;
  subTotalC: number;
  subTotalTerceros: number;
  totalAnnualCost: number;
  totalDailyCost: number;
  factor: number;
  seguroSocial: number;
  inces: number;
  lph: number;
  paroForzoso: number;
  // Mapa generico de cargas de terceros, por clave del pais (ver
  // jurisdiction_modules.config.third_party_charges_pct_of_subtotal_a).
  // Para VE coincide exactamente con seguroSocial/inces/lph/paroForzoso
  // arriba; para otro pais con otras claves, es la unica fuente confiable.
  charges: Record<string, number>;
}

export function calculateFscl(
  input: FsclInput,
  thirdPartyChargesPct: Record<string, number> = VE_DEFAULT_THIRD_PARTY_CHARGES_PCT
): FsclResult {
  const sb = input.dailyBasicSalary || 0;
  const calDays = input.calendarDays || 365;
  const nonWorked = input.nonWorkedDays || 0;
  const worked = calDays - nonWorked;

  const isa = sb * ((input.isaPercentage || 0) / 100);
  const travel = input.travelTimeAmount || 0;
  const subTotalA = (sb + isa + travel) * calDays;

  const preaviso = sb * (input.preavisoDays || 0);
  const antigLegal = sb * (input.antiguedadLegalDays || 0);
  const antigContractual = sb * (input.antiguedadContractualDays || 0);
  const vacaciones = sb * (input.vacacionesDays || 0);
  const bonoVac = sb * (input.bonoVacacionalDays || 0);
  const utilidades = sb * (input.utilidadesDays || 0);
  const subTotalB = preaviso + antigLegal + antigContractual + vacaciones + bonoVac + utilidades;

  const epp = input.eppAmount || 0;
  const agua = input.aguaHieloAmount || 0;
  const clinica = input.clinicaAmount || 0;
  const subTotalC = epp + agua + clinica;

  const { charges, subTotalTerceros } = applyThirdPartyCharges(subTotalA, thirdPartyChargesPct);
  const seguroSocial = charges.seguro_social || 0;
  const inces = charges.inces || 0;
  const lph = charges.lph || 0;
  const paroForzoso = charges.paro_forzoso || 0;

  const totalAnnualCost = subTotalA + subTotalB + subTotalC + subTotalTerceros;
  const totalDailyCost = totalAnnualCost / calDays;
  const factor = sb === 0 ? 0 : totalDailyCost / sb;

  return {
    worked, subTotalA, subTotalB, subTotalC, subTotalTerceros,
    totalAnnualCost, totalDailyCost, factor,
    seguroSocial, inces, lph, paroForzoso, charges,
  };
}