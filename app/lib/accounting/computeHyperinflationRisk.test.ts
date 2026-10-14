import { describe, it, expect, beforeEach, vi } from "vitest";

// Mismo patron de mock que computeAccountingAnomalies.test.ts: esta
// funcion habla directo con Supabase, asi que se sustituye el modulo por
// un doble que devuelve filas fijas de price_indices.
let mockFrom: (table: string) => any;

vi.mock("@/app/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

const { computeHyperinflationRisk } = await import("./computeHyperinflationRisk");

function makeChain(data: any[]) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    then: (resolve: any, reject?: any) => Promise.resolve({ data }).then(resolve, reject),
  };
  return chain;
}

function rowsOf(priceIndexRows: { period_date: string; index_value: number }[]) {
  return () => makeChain(priceIndexRows);
}

beforeEach(() => {
  mockFrom = () => makeChain([]);
});

describe("computeHyperinflationRisk", () => {
  it("retorna SIN_DATOS cuando no hay ninguna fila cargada para el pais/indice", async () => {
    mockFrom = rowsOf([]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result).toEqual({ level: "SIN_DATOS", cumulative36MonthPct: null, latestDate: null, baselineDate: null, monthsOfHistory: 0 });
  });

  it("retorna SIN_DATOS cuando hay datos pero ninguno llega a 36 meses de historia", async () => {
    // Solo 3 meses cargados, todos muy cerca del mes mas reciente -- no
    // hay ningun mes <= al objetivo de 36 meses atras.
    mockFrom = rowsOf([
      { period_date: "2025-11-01", index_value: 100 },
      { period_date: "2025-12-01", index_value: 110 },
      { period_date: "2026-01-01", index_value: 120 },
    ]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result.level).toBe("SIN_DATOS");
    expect(result.cumulative36MonthPct).toBeNull();
    expect(result.baselineDate).toBeNull();
    expect(result.latestDate).toBe("2026-01");
    expect(result.monthsOfHistory).toBe(3);
  });

  it("clasifica NORMAL cuando la inflacion acumulada de 36 meses es menor a 50%", async () => {
    // (120 / 100 - 1) * 100 = 20%
    mockFrom = rowsOf([
      { period_date: "2023-01-01", index_value: 100 },
      { period_date: "2026-01-01", index_value: 120 },
    ]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result.level).toBe("NORMAL");
    expect(result.cumulative36MonthPct).toBeCloseTo(20, 6);
    expect(result.baselineDate).toBe("2023-01");
    expect(result.latestDate).toBe("2026-01");
  });

  it("clasifica VIGILANCIA entre 50% y 80% de inflacion acumulada", async () => {
    // (160 / 100 - 1) * 100 = 60%
    mockFrom = rowsOf([
      { period_date: "2023-01-01", index_value: 100 },
      { period_date: "2026-01-01", index_value: 160 },
    ]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result.level).toBe("VIGILANCIA");
    expect(result.cumulative36MonthPct).toBeCloseTo(60, 6);
  });

  it("clasifica ALERTA entre 80% y 100% de inflacion acumulada", async () => {
    // (190 / 100 - 1) * 100 = 90%
    mockFrom = rowsOf([
      { period_date: "2023-01-01", index_value: 100 },
      { period_date: "2026-01-01", index_value: 190 },
    ]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result.level).toBe("ALERTA");
    expect(result.cumulative36MonthPct).toBeCloseTo(90, 6);
  });

  it("clasifica ACTIVA cuando la inflacion acumulada llega o supera el 100% (umbral de NIC 29)", async () => {
    // (210 / 100 - 1) * 100 = 110%
    mockFrom = rowsOf([
      { period_date: "2023-01-01", index_value: 100 },
      { period_date: "2026-01-01", index_value: 210 },
    ]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result.level).toBe("ACTIVA");
    expect(result.cumulative36MonthPct).toBeCloseTo(110, 6);
  });

  it("usa el mes disponible mas cercano (no el exacto) cuando hay huecos en el historico", async () => {
    // Faltan 2022-11 y 2023-01 (el mes exacto de 36 meses atras desde
    // 2026-01). Debe tomar 2022-12 como linea base (el mas cercano <=
    // al objetivo), ignorando cualquier mes posterior al objetivo.
    mockFrom = rowsOf([
      { period_date: "2022-10-15", index_value: 90 },
      { period_date: "2022-12-15", index_value: 150 },
      { period_date: "2026-01-15", index_value: 300 },
    ]);

    const result = await computeHyperinflationRisk("VE", "INPC");

    expect(result.baselineDate).toBe("2022-12");
    expect(result.latestDate).toBe("2026-01");
    expect(result.cumulative36MonthPct).toBeCloseTo(100, 6); // (300/150 - 1) * 100
    expect(result.monthsOfHistory).toBe(3);
  });
});