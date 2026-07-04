-- Migración: Fix Realtime Bridge + RLS event_ledger
-- Fecha: 2026-07-03
-- Contexto: Al probar el Realtime Bridge en vivo, se encontraron 2 bugs reales:
--   1. audit_logs.company_id era NOT NULL sin razon para casos sin empresa asociada,
--      bloqueando el trigger log_case_creation() en cada creacion de un caso.
--   2. event_ledger tenia RLS activado sin ninguna politica, bloqueando todo insert.

-- Fix 1: permitir company_id nulo en audit_logs
alter table audit_logs alter column company_id drop not null;

-- Fix 2: politicas RLS para event_ledger
create policy "authenticated_insert_ledger" on event_ledger
  for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated_read_ledger" on event_ledger
  for select
  using (auth.role() = 'authenticated');

-- PENDIENTE (anotado, no ejecutado todavia):
--   - Tabla "cases" esta en modo "Unrestricted" (RLS desactivado) - revisar y activar
--   - audit_logs y rf_audit_logs son dos tablas de auditoria distintas - decidir si se consolidan
--   - event_ledger deberia ser append-only (sin UPDATE/DELETE) una vez estabilizado el flujo
