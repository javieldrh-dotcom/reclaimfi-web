import { describe, it, expect } from "vitest";
import { calculateFscl, type FsclInput } from "./fsclMath";

const baseInput: FsclInput = {
  dailyBasicSalary: 100,
  calendarDays: 365,
  nonWorkedDays: 104,
  isaPercentage: 0,
  travelTimeAmount: 0,
  preavisoDays: 60,
  antiguedadLegalDays: 30,
  antiguedadContractualDays: 0,
  vacacionesDays: 27,
  bonoVacacionalDays: 60,
  utilidadesDays: 120,
  eppAmount: 0,
  aguaHieloAmount: 0,
  clinicaAmount: 0,
};

describe("calculateFscl", () => {
  it("calcula dias laborados como calendario menos no laborados", () => {
    const r = calculateFscl(baseInput);
    expect(r.worked).toBe(261); // 365 - 104
  });

  it("Sub Total A es (salario + ISA + viaje) * dias calendario, sin ISA ni viaje aqui", () => {
    const r = calculateFscl(baseInput);
    expect(r.subTotalA).toBeCloseTo(100 * 365, 6); // 36500
  });

  it("aplica el % de ISA sobre el salario basico antes de multiplicar por los dias", () => {
    const r = calculateFscl({ ...baseInput, isaPercentage: 10 });
    // (100 + 100*0.10 + 0) * 365 = 110 * 365
    expect(r.subTotalA).toBeCloseTo(110 * 365, 6);
  });

  it("Sub Total B es la suma de cada concepto en dias de salario, multiplicados por el salario basico", () => {
    const r = calculateFscl(baseInput);
    // (60 + 30 + 0 + 27 + 60 + 120) dias * 100 = 297 * 100
    expect(r.subTotalB).toBeCloseTo(297 * 100, 6);
  });

  it("Sub Total C es la suma directa de los montos contractuales (EPP, agua/hielo, clinica)", () => {
    const r = calculateFscl({ ...baseInput, eppAmount: 50, aguaHieloAmount: 20, clinicaAmount: 30 });
    expect(r.subTotalC).toBeCloseTo(100, 6);
  });

  it("los pagos a terceros son 11% + 2% + 2% + 2% (SSO, INCES, LPH, Paro Forzoso) sobre Sub Total A", () => {
    const r = calculateFscl(baseInput);
    expect(r.seguroSocial).toBeCloseTo(r.subTotalA * 0.11, 6);
    expect(r.inces).toBeCloseTo(r.subTotalA * 0.02, 6);
    expect(r.lph).toBeCloseTo(r.subTotalA * 0.02, 6);
    expect(r.paroForzoso).toBeCloseTo(r.subTotalA * 0.02, 6);
    expect(r.subTotalTerceros).toBeCloseTo(r.subTotalA * 0.17, 6);
  });

  it("el costo anual total es la suma de los 4 sub-totales (A + B + C + Terceros)", () => {
    const r = calculateFscl(baseInput);
    expect(r.totalAnnualCost).toBeCloseTo(r.subTotalA + r.subTotalB + r.subTotalC + r.subTotalTerceros, 6);
  });

  it("el costo diario total es el costo anual dividido entre los dias calendario", () => {
    const r = calculateFscl(baseInput);
    expect(r.totalDailyCost).toBeCloseTo(r.totalAnnualCost / 365, 6);
  });

  it("el factor FSCL es el costo diario total dividido entre el salario basico diario", () => {
    const r = calculateFscl(baseInput);
    expect(r.factor).toBeCloseTo(r.totalDailyCost / 100, 6);
  });

  it("el factor siempre es mayor a 1 con insumos positivos (el costo real de la mano de obra supera el salario base)", () => {
    const r = calculateFscl(baseInput);
    expect(r.factor).toBeGreaterThan(1);
  });

  it("no produce NaN/Infinity cuando el salario basico es 0 (formulario sin completar)", () => {
    const r = calculateFscl({ ...baseInput, dailyBasicSalary: 0 });
    expect(r.factor).toBe(0);
    expect(Number.isFinite(r.factor)).toBe(true);
  });

  it("usa 365 dias calendario por defecto si no se especifica (o llega 0/NaN)", () => {
    const r = calculateFscl({ ...baseInput, calendarDays: 0 });
    expect(r.subTotalA).toBeCloseTo(100 * 365, 6);
  });
});