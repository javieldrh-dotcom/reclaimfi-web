-- Reconstruccion de esta migracion. El archivo original quedo con el
-- contenido equivocado (la misma consulta de introspeccion de
-- 2026-10-12-period-lock-trigger.sql, mas un mensaje de commit de git
-- pegado por error al final) -- nunca contuvo el DDL que su propio nombre
-- describe.
--
-- Que hace: agrega 'PENDING_CLOSE' a los valores permitidos de
-- fiscal_periods.status (ver app/accounting/period-close/page.tsx, que ya
-- usa ese estado para el flujo de solicitud de cierre con aprobacion, y
-- app/lib/accounting/periodLock.ts, que ya documenta que un periodo en
-- PENDING_CLOSE tambien bloquea el Diario). El constraint real que esto
-- reproduce esta confirmado en
-- supabase/migrations/2026-10-12-baseline-schema-documentation.sql
-- (fiscal_periods_status_check), por lo que este archivo ya no cambia nada
-- en una base de datos que corrio esa migracion baseline -- queda aqui
-- solo para no perder el registro historico correcto de este cambio
-- puntual y dejar un nombre de migracion que sí coincide con su contenido.
--
-- Idempotente: se puede correr de nuevo sin error.

alter table public.fiscal_periods drop constraint if exists fiscal_periods_status_check;
alter table public.fiscal_periods add constraint fiscal_periods_status_check
  check (status = any (array['OPEN'::text, 'PENDING_CLOSE'::text, 'CLOSED'::text]));