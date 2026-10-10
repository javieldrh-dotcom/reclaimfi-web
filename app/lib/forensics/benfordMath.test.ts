import { describe, it, expect } from "vitest";
import { leadingDigit, madFromAmounts, bootstrapMadCI, conformityFromMad, EXPECTED_BENFORD } from "./benfordMath";

describe("leadingDigit", () => {
  it("extrae el primer digito sin importar la magnitud", () => {
    expect(leadingDigit(1234)).toBe(1);
    expect(leadingDigit(0.0456)).toBe(4);
    expect(leadingDigit(987654)).toBe(9);
  });
  it("devuelve null para 0, negativos invalidos o no finitos", () => {
    expect(leadingDigit(0)).toBeNull();
    expect(leadingDigit(NaN)).toBeNull();
    expect(leadingDigit(Infinity)).toBeNull();
  });
});

describe("madFromAmounts", () => {
  it("devuelve un MAD cercano a 0 para montos generados siguiendo Benford", () => {
    // Monta un conjunto sintetico cuyo primer digito sigue, con poco
    // error de redondeo, las proporciones esperadas (~100,000 montos en
    // total, distribuidos segun EXPECTED_BENFORD) - el MAD contra si
    // mismo debe ser ~0. Un total chico (ej. 1000) deja demasiado error
    // de redondeo por digito y hace la prueba inestable.
    const amounts: number[] = [];
    EXPECTED_BENFORD.forEach((pct, i) => {
      const digit = i + 1;
      const count = Math.round(pct * 1000); // ~100,000 montos en total
      // digit*1_000_000 + k con k < 1_000_000 mantiene el primer digito
      // fijo en `digit` para cualquier count usado aqui (el mayor,
      // ~301,000, es menor a 1_000_000).
      for (let k = 0; k < count; k++) amounts.push(digit * 1_000_000 + k);
    });
    const mad = madFromAmounts(amounts);
    expect(mad).not.toBeNull();
    expect(mad as number).toBeLessThan(0.006);
  });

  it("devuelve un MAD alto para montos manipulados (distribucion uniforme de digitos)", () => {
    const amounts: number[] = [];
    for (let digit = 1; digit <= 9; digit++) {
      for (let k = 0; k < 20; k++) amounts.push(digit * 1000 + k);
    }
    const mad = madFromAmounts(amounts);
    expect(mad).not.toBeNull();
    expect(conformityFromMad(mad as number)).toBe("NO_CONFORME");
  });

  it("devuelve null cuando no hay montos utilizables", () => {
    expect(madFromAmounts([])).toBeNull();
    expect(madFromAmounts([0, NaN, Infinity])).toBeNull();
  });
});

describe("conformityFromMad", () => {
  it("aplica los umbrales de Nigrini en orden", () => {
    expect(conformityFromMad(0.003)).toBe("ALTA");
    expect(conformityFromMad(0.009)).toBe("ACEPTABLE");
    expect(conformityFromMad(0.013)).toBe("MARGINAL");
    expect(conformityFromMad(0.02)).toBe("NO_CONFORME");
  });
});

describe("bootstrapMadCI", () => {
  it("devuelve low <= high y ambos cercanos al MAD real con una rng fija", () => {
    const amounts = [123, 456, 789, 234, 567, 891, 345, 678, 912, 159, 357, 753, 951, 264, 486];
    const realMad = madFromAmounts(amounts) as number;

    // rng determinista (LCG simple) solo para esta prueba - el llamador
    // real nunca pasa este parametro y sigue usando Math.random.
    let seed = 42;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const { low, high } = bootstrapMadCI(amounts, 500, rng);
    expect(low).toBeLessThanOrEqual(high);
    expect(low).toBeGreaterThanOrEqual(0);
    // El intervalo de confianza debe contener o quedar cerca del MAD
    // calculado sobre la muestra completa.
    expect(realMad).toBeGreaterThanOrEqual(low - 0.02);
    expect(realMad).toBeLessThanOrEqual(high + 0.02);
  });

  it("devuelve {low: 0, high: 0} si la lista de montos esta vacia", () => {
    expect(bootstrapMadCI([], 50)).toEqual({ low: 0, high: 0 });
  });
});