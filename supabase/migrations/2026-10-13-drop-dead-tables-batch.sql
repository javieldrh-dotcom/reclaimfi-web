-- Auditoria de Fase 3 (continuacion): igual que apu_items (ver
-- 2026-10-13-drop-apu-items-dead-table.sql), estas tablas existen solo
-- en la definicion del esquema. No tienen ningun .select/.insert/
-- .update/.delete en app/, ni son leidas/escritas por ningun trigger o
-- funcion de Postgres de las migraciones (verificado por busqueda
-- exhaustiva), Y se confirmo con un conteo real en Supabase que las 11
-- de abajo tienen 0 filas. Son duplicados o iteraciones de nombres
-- anteriores, reemplazados por otras tablas en uso activo:
--   forensic_cases                      -> cases
--   audit_findings, ai_findings,
--   audit_evidence, audit_chain         -> event_ledger + evidences
--   risk_alerts, risk_events,
--   risk_flags                          -> alerts + risk_scores
--   sanctions                           -> ofac_sanctioned_addresses
--   blockchain_transactions             -> case_wallet_analyses +
--                                           wallet_addresses
--   notifications                       -> nunca se cableo a ningun flujo
--
-- NO incluidas aqui a proposito (tienen filas segun el conteo real en
-- Supabase, aunque el codigo actual no las use -- hay que entender de
-- donde vinieron esos datos antes de decidir su destino):
--   investigations (20), repomo_calculations (21),
--   inflation_adjustments (94), risk_rules (2),
--   entity_relationships (1), api_rate_limits (16),
--   apu_catalog_items (39)
drop table if exists public.forensic_cases;
drop table if exists public.audit_findings;
drop table if exists public.ai_findings;
drop table if exists public.audit_evidence;
drop table if exists public.audit_chain;
drop table if exists public.risk_alerts;
drop table if exists public.risk_events;
drop table if exists public.risk_flags;
drop table if exists public.sanctions;
drop table if exists public.blockchain_transactions;
drop table if exists public.notifications;