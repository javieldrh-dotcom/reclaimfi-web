export async function casesHandler(event: any) {
  if (event.type !== "rf.case.created") return;
  // El caso ya se crea directamente en intelligenceOrchestrator.ts
  // antes de emitir este evento, para poder capturar el ID real
  // y propagarlo a los eventos siguientes (alert, risk, entity.batch).
  // Este handler queda como punto de extension futuro si se necesita
  // logica adicional al observar la creacion de un caso.
}