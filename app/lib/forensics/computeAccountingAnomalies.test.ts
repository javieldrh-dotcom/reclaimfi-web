import { describe, it, expect, beforeEach, vi } from "vitest";

// computeAccountingAnomalies.ts habla directo con Supabase (no es una
// funcion pura como benfordMath/outlierMath), asi que para probarla sin
// una base de datos real se sustituye el modulo @/app/lib/supabase por
// un doble que responde con datos fijos por tabla, en el mismo orden en
// que el codigo real hace sus consultas. "mockFrom" se reasigna en cada
// test (beforeEach la resetea a un valor por defecto) y el factory de
// vi.mock la captura por referencia -- por eso el mock funciona aunque
// se declare antes de asignarle valor.
let mockFrom: (table: string) => any;

vi.mock("@/app/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

const { computeAccountingAnomalies } = await import("./computeAccountingAnomalies");

function makeChain(data: any[]) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    lte: () => chain,
    in: () => chain,
    order: () => chain,
    then: (resolve: any, reject?: any) => Promise.resolve({ data }).then(resolve, reject),
  };
  return chain;
}

// Cada tabla puede ser consultada mas de una vez por llamada (p.ej.
// journal_entries se consulta primero para el chequeo de integridad
// acumulado y luego, por separado, acotado al periodo) -- "queues" da
// las respuestas en el mismo orden en que el codigo real las pide.
function queuedSupabaseFrom(queues: Record<string, any[][]>) {
  const used: Record<string, number> = {};
  return (table: string) => {
    const idx = used[table] ?? 0;
    used[table] = idx + 1;
    const data = queues[table]?.[idx] ?? [];
    return makeChain(data);
  };
}

beforeEach(() => {
  mockFrom = () => makeChain([]);
});

describe("computeAccountingAnomalies", () => {
  it("retorna integridad balanceada y sin anomalias cuando no hay asientos en el periodo", async () => {
    mockFrom = queuedSupabaseFrom({
      journal_entries: [[], []], // allActiveEntries vacio, period entries vacio
    });

    const result = await computeAccountingAnomalies("company-1", "2026-01-01", "2026-01-31");

    expect(result.balanceIntegrity).toEqual({ totalDebit: 0, totalCredit: 0, difference: 0, balanced: true });
    expect(result.outliers).toEqual({ accountsAnalyzed: 0, accountsSkipped: 0, flagged: [] });
    expect(result.benford.applicable).toBe(false);
    expect(result.benford.reason).toBe("Sin asientos en el periodo.");
  });

  it("detecta un desbalance acumulado (debito != credito) aunque el periodo no tenga asientos propios", async () => {
    // Este es exactamente el escenario que Javiel reprodujo a mano
    // (numeros aleatorios que no cuadran): alguna escritura dejo
    // journal_lines sin pasar por la validacion de "asiento balanceado".
    mockFrom = queuedSupabaseFrom({
      journal_entries: [[{ id: "e1" }], []], // allActiveEntries=[e1], period entries vacio (corta temprano)
      journal_lines: [[{ debit: 100, credit: 0 }, { debit: 0, credit: 50 }]],
    });

    const result = await computeAccountingAnomalies("company-1", "2026-01-01", "2026-01-31");

    expect(result.balanceIntegrity.totalDebit).toBe(100);
    expect(result.balanceIntegrity.totalCredit).toBe(50);
    expect(result.balanceIntegrity.difference).toBe(50);
    expect(result.balanceIntegrity.balanced).toBe(false);
  });

  it("marca como outlier la transaccion que se aleja de las demas en una cuenta, e ignora cuentas con menos de 5 muestras", async () => {
    const normalAccountLines = [100, 102, 98, 101, 99, 100000].map((amount, i) => ({
      journal_entry_id: "e" + i,
      account_id: "acct-caja",
      debit: amount,
      credit: 0,
    }));
    const smallSampleAccountLines = [500, 510, 495].map((amount, i) => ({
      journal_entry_id: "f" + i,
      account_id: "acct-banco",
      debit: amount,
      credit: 0,
    }));
    const periodEntries = [...normalAccountLines, ...smallSampleAccountLines].map((l) => ({
      id: l.journal_entry_id,
      description: "Movimiento " + l.journal_entry_id,
      entry_date: "2026-01-15",
    }));

    mockFrom = queuedSupabaseFrom({
      journal_entries: [[], periodEntries], // allActiveEntries vacio (no se evalua integridad aqui), period entries reales
      chart_of_accounts: [[{ id: "acct-caja", account_name: "Caja" }, { id: "acct-banco", account_name: "Banco" }]],
      journal_lines: [[...normalAccountLines, ...smallSampleAccountLines]],
    });

    const result = await computeAccountingAnomalies("company-1", "2026-01-01", "2026-01-31");

    expect(result.outliers.accountsAnalyzed).toBe(1); // solo Caja tiene >= 5 muestras
    expect(result.outliers.accountsSkipped).toBe(1); // Banco (3 muestras) se omite
    expect(result.outliers.flagged).toHaveLength(1);
    expect(result.outliers.flagged[0].accountName).toBe("Caja");
    expect(result.outliers.flagged[0].amount).toBe(100000);
  });

  it("aplica la Ley de Benford solo cuando hay al menos 30 montos utilizables en el periodo", async () => {
    const lines = Array.from({ length: 30 }, (_, i) => ({
      journal_entry_id: "e" + i,
      account_id: "acct-caja",
      debit: (i + 1) * 37, // montos distintos y positivos, sin outlier extremo
      credit: 0,
    }));
    const periodEntries = lines.map((l) => ({ id: l.journal_entry_id, description: "Mov " + l.journal_entry_id, entry_date: "2026-01-10" }));

    mockFrom = queuedSupabaseFrom({
      journal_entries: [[], periodEntries],
      chart_of_accounts: [[{ id: "acct-caja", account_name: "Caja" }]],
      journal_lines: [lines],
    });

    const result = await computeAccountingAnomalies("company-1", "2026-01-01", "2026-01-31");

    expect(result.benford.applicable).toBe(true);
    expect(result.benford.sampleSize).toBe(30);
    expect(result.benford.conformity).not.toBeNull();
    expect(result.benford.reason).toBeNull();
  });

  it("no aplica la Ley de Benford con menos de 30 montos (declara la razon explicitamente)", async () => {
    const lines = Array.from({ length: 10 }, (_, i) => ({
      journal_entry_id: "e" + i,
      account_id: "acct-caja",
      debit: (i + 1) * 10,
      credit: 0,
    }));
    const periodEntries = lines.map((l) => ({ id: l.journal_entry_id, description: "Mov " + l.journal_entry_id, entry_date: "2026-01-10" }));

    mockFrom = queuedSupabaseFrom({
      journal_entries: [[], periodEntries],
      chart_of_accounts: [[{ id: "acct-caja", account_name: "Caja" }]],
      journal_lines: [lines],
    });

    const result = await computeAccountingAnomalies("company-1", "2026-01-01", "2026-01-31");

    expect(result.benford.applicable).toBe(false);
    expect(result.benford.sampleSize).toBe(10);
    expect(result.benford.conformity).toBeNull();
    expect(result.benford.reason).toContain("10 montos");
  });
});