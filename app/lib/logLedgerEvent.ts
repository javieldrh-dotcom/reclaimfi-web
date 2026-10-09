// Helper cliente para registrar un evento en la cadena de custodia
// (event_ledger) despues de una escritura exitosa en el modulo de
// Auditoria Financiera (creacion de caso, evidencia, reconstruccion,
// etc). Es "best-effort": la operacion principal (el insert real contra
// cases/evidences/etc) ya se completo antes de llamar esto, asi que un
// fallo aqui (red, sesion expirada) NUNCA debe bloquear ni revertir la UI
// - solo se registra en consola, igual que el patron existente en
// app/lib/eventBus.ts (ingestLedgerEvent(...).catch(...)).
export async function logLedgerEvent(type: string, caseId: string, payload: Record<string, any> = {}) {
  try {
    const res = await fetch("/api/ledger/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, case_id: caseId, payload }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[LEDGER LOG ERROR]", type, caseId, body?.error || res.status);
    }
  } catch (err) {
    console.error("[LEDGER LOG ERROR]", type, caseId, err);
  }
}