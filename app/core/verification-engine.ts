import { supabase } from "@/app/lib/supabase";

// La integridad de la cadena de custodia solo tiene sentido evaluada por
// cadena individual: cada caso tiene su propia cadena de hashes, y cada
// empresa tiene ademas su propia cadena independiente para eventos sin
// caso (cierre de periodo, reverso de asientos, adjudicacion APU - Fase
// 5, ver ledger-engine.ts). Verificar toda la tabla event_ledger junta
// mezclaria cadenas distintas como si fueran una sola.
//
// Se acepta tanto la firma vieja (un string = caseId, para no romper el
// unico llamador existente, AuditLedgerView) como un objeto { caseId } o
// { companyId } para verificar la cadena de una empresa.
export async function verifyLedgerIntegrity(arg: string | { caseId?: string; companyId?: string }) {
  const caseId = typeof arg === "string" ? arg : arg.caseId ?? null;
  const companyId = typeof arg === "string" ? null : arg.companyId ?? null;

  if (!caseId && !companyId) {
    return {
      valid: false,
      message: "Se requiere un caso o una empresa para verificar la cadena de custodia",
      brokenAt: null,
    };
  }

  let query = supabase.from("event_ledger").select("*").order("created_at", { ascending: true });
  query = caseId ? query.eq("case_id", caseId) : query.is("case_id", null).eq("company_id", companyId as string);

  const { data, error } = await query;

  if (error) {
    console.error("[VERIFY ERROR]", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      valid: true,
      message: "No se encontraron eventos de cadena de custodia para " + (caseId ? "este caso" : "esta empresa"),
      brokenAt: null,
    };
  }

  let previousHash: string | null = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // 1. verificar encadenamiento
    if (row.previous_hash !== previousHash) {
      return {
        valid: false,
        message: "Cadena de custodia rota",
        brokenAt: {
          index: i,
          id: row.id,
          expected: previousHash,
          found: row.previous_hash,
        },
      };
    }

    // 2. avanzar cadena
    previousHash = row.event_hash;
  }

  return {
    valid: true,
    message: "Cadena de custodia valida para " + (caseId ? "este caso" : "esta empresa"),
    totalEvents: data.length,
  };
}