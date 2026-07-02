import { supabase } from "@/app/lib/supabase/client";

export async function verifyLedgerIntegrity() {
  const { data, error } = await supabase
    .from("event_ledger")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[VERIFY ERROR]", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      valid: true,
      message: "No ledger data found",
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
        message: "Chain broken detected",
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
    message: "Ledger integrity valid",
    totalEvents: data.length,
  };
}