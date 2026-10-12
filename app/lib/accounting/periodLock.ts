// Logica pura del bloqueo de periodo cerrado en el Diario (app/accounting/journal/page.tsx).
// Extraida para poder probarla sin Supabase, igual patron que
// app/lib/forensics/* (Fase 3) y app/lib/reportHash.ts (Fase 4): separar el
// calculo/regla de negocio de la consulta a la base de datos que lo
// alimenta, para que un test cubra la regla sin tener que simular la red.
//
// Importante: esta funcion replica el comportamiento ACTUAL del cliente
// (bloquea si la fecha cae dentro de CUALQUIER fila de fiscal_periods para
// esa empresa, sin filtrar por status) -- journal/page.tsx nunca filtro por
// status "CLOSED" al consultar, asi que un periodo con una solicitud de
// cierre todavia PENDING_CLOSE tambien congela esa fecha. Se documenta aqui
// explicitamente porque no es obvio leyendo solo el nombre de la funcion.
export interface FiscalPeriodRange {
  period_start: string; // "YYYY-MM-DD"
  period_end: string; // "YYYY-MM-DD"
}

/**
 * Devuelve el primer periodo (cerrado o pendiente de cierre) cuyo rango
 * contiene la fecha dada, o null si la fecha es editable. Las fechas se
 * comparan como strings "YYYY-MM-DD" (orden lexicografico = orden
 * cronologico para ese formato, sin zona horaria de por medio).
 */
export function findLockingPeriod(
  date: string,
  periods: FiscalPeriodRange[]
): FiscalPeriodRange | null {
  if (!date) return null;
  for (const p of periods) {
    if (p.period_start <= date && date <= p.period_end) {
      return p;
    }
  }
  return null;
}

export function isDateLocked(date: string, periods: FiscalPeriodRange[]): boolean {
  return findLockingPeriod(date, periods) !== null;
}