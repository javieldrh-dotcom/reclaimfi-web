import { supabase } from "@/app/lib/supabase";

// La integridad de la cadena de custodia solo tiene sentido evaluada por
// caso individual: cada caso tiene su propia cadena de hashes (ver
// ledger-engine.ts). Verificar toda la tabla event_ledger junta mezclaria
// eventos de casos y empresas distintas como si fueran una sola cadena.
export async function verifyLedgerIntegrity(caseId: string) {
  if (!caseId) {
    return {
      valid: false,
      message: "Se requiere un caso para verificar la cadena de custodia",
      brokenAt: null,
    };
  }

  const { data, error } = await supabase
    .from("event_ledger")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[VERIFY ERROR]", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      valid: true,
      message: "No se encontraron eventos de cadena de custodia para este caso",
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
    message: "Cadena de custodia valida para este caso",
    totalEvents: data.length,
  };
}
