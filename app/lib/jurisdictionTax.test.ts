import { describe, it, expect } from "vitest";
import {
  calculateBracketTax,
  applyThirdPartyCharges,
  filterEmployerChargesByHeadcount,
  VE_DEFAULT_THIRD_PARTY_CHARGES_PCT,
  VE_DEFAULT_PAYROLL_CHARGES,
  type IncomeTaxConfig,
} from "./jurisdictionTax";

// Esta funcion calcula ISLR (app/accounting/islr/page.tsx), FSCL
// (app/apu/fscl/page.tsx) y nomina (app/accounting/payroll/page.tsx) para
// TODAS las empresas de la plataforma -- hasta hoy no tenia ni una sola
// prueba automatizada, a pesar de ser dinero real. Los tramos de VE
// Tarifa 2 usados aqui son los mismos valores exactos que el respaldo
// hardcodeado en app/accounting/islr/page.tsx (2000 UT / 15%, 3000 UT /
// 22% - 140, resto 34% - 500), para que un cambio accidental en la logica
// de calculateBracketTax se detecte contra el caso real que ya esta en
// produccion, no contra numeros inventados.
const VE_TARIFA_2: IncomeTaxConfig = {
  name: "ISLR - Tarifa 2",
  unit: "UT",
  unit_value_required: true,
  brackets: [
    { upTo_UT: 2000, rate_pct: 15, sustraendo_UT: 0 },
    { upTo_UT: 3000, rate_pct: 22, sustraendo_UT: 140 },
    { upTo_UT: null, rate_pct: 34, sustraendo_UT: 500 },
  ],
};

describe("calculateBracketTax", () => {
  it("aplica el primer tramo (sin sustraendo) cuando la base cae dentro de el", () => {
    // 1000 UT * 15% - 0 = 150 UT
    const result = calculateBracketTax(1000, VE_TARIFA_2, 1);
    expect(result.baseInUnits).toBe(1000);
    expect(result.rate).toBe(15);
    expect(result.sustraendo).toBe(0);
    expect(result.tax).toBeCloseTo(150, 6);
  });

  it("aplica el segundo tramo cuando la base cae justo en su limite superior", () => {
    // 3000 UT * 22% - 140 = 520 UT (el limite se trata inclusivo, <=)
    const result = calculateBracketTax(3000, VE_TARIFA_2, 1);
    expect(result.rate).toBe(22);
    expect(result.sustraendo).toBe(140);
    expect(result.tax).toBeCloseTo(520, 6);
  });

  it("aplica el tramo final (upTo_UT null) cuando la base supera todos los limites", () => {
    // 5000 UT * 34% - 500 = 1200 UT
    const result = calculateBracketTax(5000, VE_TARIFA_2, 1);
    expect(result.rate).toBe(34);
    expect(result.sustraendo).toBe(500);
    expect(result.tax).toBeCloseTo(1200, 6);
  });

  it("convierte la base a unidades tributarias usando unitValue cuando el modulo lo requiere", () => {
    // Base en moneda local 300000, UT = 150 -> 2000 UT exactos (primer tramo, limite)
    const result = calculateBracketTax(300000, VE_TARIFA_2, 150);
    expect(result.baseInUnits).toBeCloseTo(2000, 6);
    expect(result.rate).toBe(15);
    expect(result.tax).toBeCloseTo(300000 * 0.15, 2); // 150 UT * 150 = igual en moneda local
  });

  it("ignora unitValue cuando unit_value_required es false (tasa plana sin unidad)", () => {
    const flatConfig: IncomeTaxConfig = {
      name: "Tasa plana de ejemplo",
      unit: "moneda_local",
      unit_value_required: false,
      brackets: [{ upTo_UT: null, rate_pct: 25, sustraendo_UT: 0 }],
    };
    // Si usara unitValue=150 por error, el resultado seria distinto a este.
    const result = calculateBracketTax(100000, flatConfig, 150);
    expect(result.baseInUnits).toBe(100000);
    expect(result.tax).toBeCloseTo(25000, 2);
  });

  it("funciona con un unico bracket de tasa plana (pais sin tramos progresivos)", () => {
    const flatConfig: IncomeTaxConfig = {
      name: "Tasa plana",
      unit: "UT",
      brackets: [{ upTo_UT: null, rate_pct: 10, sustraendo_UT: 0 }],
    };
    const result = calculateBracketTax(50000, flatConfig, 1);
    expect(result.rate).toBe(10);
    expect(result.tax).toBeCloseTo(5000, 6);
  });

  it("ordena los brackets correctamente sin importar el orden en que se declaren en el config", () => {
    const shuffled: IncomeTaxConfig = {
      name: "Tarifa 2 desordenada",
      unit: "UT",
      unit_value_required: true,
      brackets: [
        { upTo_UT: null, rate_pct: 34, sustraendo_UT: 500 },
        { upTo_UT: 2000, rate_pct: 15, sustraendo_UT: 0 },
        { upTo_UT: 3000, rate_pct: 22, sustraendo_UT: 140 },
      ],
    };
    const result = calculateBracketTax(1000, shuffled, 1);
    expect(result.rate).toBe(15);
    expect(result.tax).toBeCloseTo(150, 6);
  });
});

describe("applyThirdPartyCharges", () => {
  it("calcula cada carga como un porcentaje independiente del mismo subTotalA (FSCL de VE)", () => {
    const { charges, subTotalTerceros } = applyThirdPartyCharges(1000, VE_DEFAULT_THIRD_PARTY_CHARGES_PCT);
    expect(charges.seguro_social).toBeCloseTo(110, 6); // 11%
    expect(charges.inces).toBeCloseTo(20, 6); // 2%
    expect(charges.lph).toBeCloseTo(20, 6); // 2%
    expect(charges.paro_forzoso).toBeCloseTo(20, 6); // 2%
    // 11+2+2+2 = 17% de 1000 = 170
    expect(subTotalTerceros).toBeCloseTo(170, 6);
  });

  it("calcula las cargas de nomina de VE (empleado y patronal) por separado sobre el mismo bruto", () => {
    const gross = 2000;
    const employee = applyThirdPartyCharges(gross, VE_DEFAULT_PAYROLL_CHARGES.employee_pct);
    const employer = applyThirdPartyCharges(gross, VE_DEFAULT_PAYROLL_CHARGES.employer_pct);

    // IVSS empleado 4% + LPH empleado 1% + Paro Forzoso empleado 0.5% = 5.5% de 2000 = 110
    expect(employee.subTotalTerceros).toBeCloseTo(110, 6);
    // IVSS patronal 9% + INCES 2% + FAOV 2% + Paro Forzoso patronal 2% = 15% de 2000 = 300
    expect(employer.subTotalTerceros).toBeCloseTo(300, 6);
  });

  it("retorna cero cuando no hay cargas configuradas (jurisdiccion sin ese concepto)", () => {
    const { charges, subTotalTerceros } = applyThirdPartyCharges(1000, {});
    expect(charges).toEqual({});
    expect(subTotalTerceros).toBe(0);
  });

  it("escala linealmente con la base (subTotalA de cero da cero cargas)", () => {
    const { subTotalTerceros } = applyThirdPartyCharges(0, VE_DEFAULT_THIRD_PARTY_CHARGES_PCT);
    expect(subTotalTerceros).toBe(0);
  });
});

describe("filterEmployerChargesByHeadcount", () => {
  it("excluye INCES cuando la empresa tiene menos de 5 empleados activos (Ley INCES art. 49)", () => {
    const filtered = filterEmployerChargesByHeadcount(VE_DEFAULT_PAYROLL_CHARGES, 3);
    expect(filtered).not.toHaveProperty("inces");
    expect(filtered.ivss_patronal).toBe(9);
    expect(filtered.faov).toBe(2);
    expect(filtered.paro_forzoso_patronal).toBe(2);
  });

  it("incluye INCES cuando la empresa tiene exactamente 5 empleados activos (umbral inclusive)", () => {
    const filtered = filterEmployerChargesByHeadcount(VE_DEFAULT_PAYROLL_CHARGES, 5);
    expect(filtered.inces).toBe(2);
  });

  it("incluye INCES cuando la empresa tiene mas de 5 empleados activos", () => {
    const filtered = filterEmployerChargesByHeadcount(VE_DEFAULT_PAYROLL_CHARGES, 20);
    expect(filtered.inces).toBe(2);
  });

  it("no excluye nada cuando el config no define employer_pct_min_employees (jurisdiccion sin ese requisito)", () => {
    const noThresholdConfig = {
      name: "Jurisdiccion sin umbrales",
      employee_pct: {},
      employer_pct: { carga_x: 5, carga_y: 3 },
    };
    const filtered = filterEmployerChargesByHeadcount(noThresholdConfig, 1);
    expect(filtered).toEqual({ carga_x: 5, carga_y: 3 });
  });
});