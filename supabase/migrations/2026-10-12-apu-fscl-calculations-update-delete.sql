-- Fix: fiscal_periods_status_check solo permitia 'OPEN'/'CLOSED', pero el
-- flujo de cierre de ejercicio (maker-checker) necesita un estado
-- intermedio 'PENDING_CLOSE' (solicitado, pendiente de aprobacion antes de
-- registrar los asientos de cierre). Sin este fix, el boton "Solicitar
-- Cierre de Ejercicio" fallaba con:
--   new row for relation "fiscal_periods" violates check constraint
--   "fiscal_periods_status_check"
-- -- el flujo de dos pasos nunca habia funcionado.
--
-- NOTA: esta migracion se corrio manualmente en el SQL Editor de Supabase
-- el 2026-10-12, y se confirmo en vivo que el flujo completo (solicitar
-- cierre -> aprobar -> asientos de cierre registrados) funciona de
-- extremo a extremo. Se retro-documenta aqui; la definicion final
-- coincide exactamente con lo verificado via introspeccion en vivo
-- (pg_get_constraintdef).

alter table public.fiscal_periods drop constraint if exists fiscal_periods_status_check;
alter table public.fiscal_periods add constraint fiscal_periods_status_check
  check (status = any (array['OPEN'::text, 'PENDING_CLOSE'::text, 'CLOSED'::text]));