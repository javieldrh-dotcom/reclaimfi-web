import { describe, it, expect } from "vitest";
import { findLockingPeriod, isDateLocked, type FiscalPeriodRange } from "./periodLock";

describe("periodLock", () => {
  const q1_2026: FiscalPeriodRange = { period_start: "2026-01-01", period_end: "2026-03-31" };

  it("bloquea una fecha estrictamente dentro del rango", () => {
    expect(isDateLocked("2026-02-15", [q1_2026])).toBe(true);
  });

  it("bloquea en el limite inferior del rango (period_start inclusive)", () => {
    expect(isDateLocked("2026-01-01", [q1_2026])).toBe(true);
  });

  it("bloquea en el limite superior del rango (period_end inclusive)", () => {
    expect(isDateLocked("2026-03-31", [q1_2026])).toBe(true);
  });

  it("no bloquea un dia antes de period_start", () => {
    expect(isDateLocked("2025-12-31", [q1_2026])).toBe(false);
  });

  it("no bloquea un dia despues de period_end", () => {
    expect(isDateLocked("2026-04-01", [q1_2026])).toBe(false);
  });

  it("no bloquea nada cuando no hay periodos", () => {
    expect(isDateLocked("2026-02-15", [])).toBe(false);
  });

  it("revisa varios periodos no contiguos de la misma empresa", () => {
    const q3_2026: FiscalPeriodRange = { period_start: "2026-07-01", period_end: "2026-09-30" };
    const periods = [q1_2026, q3_2026];
    expect(isDateLocked("2026-08-10", periods)).toBe(true); // cae en Q3
    expect(isDateLocked("2026-05-10", periods)).toBe(false); // Q2, sin cerrar
  });

  it("findLockingPeriod devuelve el periodo exacto que bloquea, para el mensaje al usuario", () => {
    const found = findLockingPeriod("2026-02-15", [q1_2026]);
    expect(found).toEqual(q1_2026);
  });

  it("findLockingPeriod devuelve null cuando la fecha es editable", () => {
    expect(findLockingPeriod("2026-04-01", [q1_2026])).toBeNull();
  });

  it("devuelve false/null con fecha vacia (input sin completar en el formulario)", () => {
    expect(isDateLocked("", [q1_2026])).toBe(false);
    expect(findLockingPeriod("", [q1_2026])).toBeNull();
  });
});