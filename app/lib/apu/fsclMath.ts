// Calculo del Factor Sobre Costo de Labor (FSCL) bajo el Contrato Colectivo
// Petrolero (CCTP), extraido de app/apu/fscl/page.tsx para poder probarlo
// sin React ni Supabase -- mismo patron que app/lib/forensics/* (Fase 3) y
// app/lib/reportHash.ts (Fase 4). La UI sigue siendo la unica que llama a
// esta funcion; este archivo no agrega ningun comportamiento nuevo.
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
}

export function calculateFscl(input: FsclInput): FsclResult {
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

  const seguroSocial = subTotalA * 0.11;
  const inces = subTotalA * 0.02;
  const lph = subTotalA * 0.02;
  const paroForzoso = subTotalA * 0.02;
  const subTotalTerceros = seguroSocial + inces + lph + paroForzoso;

  const totalAnnualCost = subTotalA + subTotalB + subTotalC + subTotalTerceros;
  const totalDailyCost = totalAnnualCost / calDays;
  const factor = sb === 0 ? 0 : totalDailyCost / sb;

  return {
    worked, subTotalA, subTotalB, subTotalC, subTotalTerceros,
    totalAnnualCost, totalDailyCost, factor,
    seguroSocial, inces, lph, paroForzoso,
  };
}