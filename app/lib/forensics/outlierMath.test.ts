import { describe, it, expect } from "vitest";
import { median, modifiedZScores } from "./outlierMath";

describe("median", () => {
  it("promedia los dos valores centrales cuando n es par", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it("devuelve el valor central cuando n es impar", () => {
    expect(median([5, 1, 3])).toBe(3);
  });
  it("devuelve 0 para una lista vacia", () => {
    expect(median([])).toBe(0);
  });
});

describe("modifiedZScores", () => {
  // Replica el caso que rompio 2 veces esta deteccion en produccion antes
  // de llegar a mediana/MAD (ver Fase 3 de la hoja de ruta): una cuenta
  // con ~30 gastos normales entre 800 y 3000, y 3 fraudes inyectados muy
  // por encima de ese rango. Con media/desviacion estandar (en monto
  // crudo o en log) estos 3 fraudes o generaban decenas de falsos
  // positivos, o no se detectaban ninguno. Con mediana/MAD deben
  // marcarse los 3 y nada mas.
  const normalExpenses = [
    950, 1100, 1380, 920, 1600, 1050, 1420, 980, 1750, 1230, 1090, 1480, 1340,
    1010, 1600, 1120, 1390, 1270, 1500, 1060, 1430, 1180, 1320, 1090, 1610,
  ];
  const injectedFrauds = [48500, 52750, 39900];
  const amounts = [...normalExpenses, ...injectedFrauds];
  const logValues = amounts.map((v) => Math.log(v));
  const Z_THRESHOLD = 2.5;

  it("marca exactamente los 3 fraudes inyectados y ninguna transaccion normal", () => {
    const { zScores } = modifiedZScores(logValues);
    const flaggedIndices = zScores
      .map((z, i) => ({ z, i }))
      .filter(({ z }) => Math.abs(z) > Z_THRESHOLD)
      .map(({ i }) => i);

    const fraudIndices = [normalExpenses.length, normalExpenses.length + 1, normalExpenses.length + 2];
    expect(flaggedIndices.sort()).toEqual(fraudIndices.sort());
  });

  it("devuelve mad 0 cuando todos los valores son iguales (sin dispersion)", () => {
    const { mad, zScores } = modifiedZScores([5, 5, 5, 5]);
    expect(mad).toBe(0);
    expect(zScores).toEqual([0, 0, 0, 0]);
  });
});