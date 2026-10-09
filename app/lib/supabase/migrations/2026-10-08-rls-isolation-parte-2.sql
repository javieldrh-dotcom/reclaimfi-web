-- CORRECCION QUIRURGICA basada en el estado REAL de la base (verificado
-- con pg_policies). NO SE TOCAN: cases, alerts, entities, evaluations,
-- risk_scores -> ya estaban correctamente aisladas por empresa.
--
-- Este script es IDEMPOTENTE: cada create policy tiene su propio
-- drop policy if exists justo antes, para poder correrlo de nuevo sin
-- importar que un intento anterior haya dejado algunas politicas ya
-- creadas (el SQL Editor del dashboard no parece ejecutar todo el script
-- como una sola transaccion, asi que un error a mitad de camino puede
-- dejar la primera mitad ya aplicada).

-- ============ WALLET_ADDRESSES ============
drop policy if exists authenticated_read on public.wallet_addresses;

drop policy if exists wallet_addresses_select_own_company on public.wallet_addresses;
create policy wallet_addresses_select_own_company on public.wallet_addresses
  for select using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

drop policy if exists wallet_addresses_insert_own_company on public.wallet_addresses;
create policy wallet_addresses_insert_own_company on public.wallet_addresses
  for insert with check (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

-- ============ CASE_WALLET_ANALYSES ============
drop policy if exists read_case_wallet_analyses on public.case_wallet_analyses;

drop policy if exists case_wallet_analyses_select_own_company on public.case_wallet_analyses;
create policy case_wallet_analyses_select_own_company on public.case_wallet_analyses
  for select using (
    exists (
      select 1 from public.cases
      where cases.id = case_wallet_analyses.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

drop policy if exists case_wallet_analyses_insert_own_company on public.case_wallet_analyses;
create policy case_wallet_analyses_insert_own_company on public.case_wallet_analyses
  for insert with check (
    exists (
      select 1 from public.cases
      where cases.id = case_wallet_analyses.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

-- ============ AUDIT_LOGS ============
drop policy if exists authenticated_insert_audit_logs on public.audit_logs;

-- ============ EVENT_LEDGER ============
drop policy if exists authenticated_insert_ledger on public.event_ledger;
drop policy if exists via_case_select on public.event_ledger;

drop policy if exists event_ledger_select_own_company on public.event_ledger;
create policy event_ledger_select_own_company on public.event_ledger
  for select using (
    case_id is not null
    and exists (
      select 1 from public.cases
      where cases.id = event_ledger.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

drop policy if exists event_ledger_insert_own_company on public.event_ledger;
create policy event_ledger_insert_own_company on public.event_ledger
  for insert with check (
    case_id is null
    or exists (
      select 1 from public.cases
      where cases.id = event_ledger.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

-- ============ EVIDENCES ============
drop policy if exists via_case_select on public.evidences;
drop policy if exists write_admin_auditor_insert on public.evidences;
drop policy if exists write_admin_auditor_update on public.evidences;
drop policy if exists write_admin_auditor_delete on public.evidences;

drop policy if exists evidences_select_own_company on public.evidences;
create policy evidences_select_own_company on public.evidences
  for select using (
    exists (
      select 1 from public.cases
      where cases.id = evidences.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

drop policy if exists evidences_insert_own_company on public.evidences;
create policy evidences_insert_own_company on public.evidences
  for insert with check (
    exists (
      select 1 from public.cases
      where cases.id = evidences.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

drop policy if exists evidences_update_own_company on public.evidences;
create policy evidences_update_own_company on public.evidences
  for update using (
    exists (
      select 1 from public.cases
      where cases.id = evidences.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

drop policy if exists evidences_delete_own_company on public.evidences;
create policy evidences_delete_own_company on public.evidences
  for delete using (
    exists (
      select 1 from public.cases
      where cases.id = evidences.case_id
        and cases.company_id in (select company_id from public.user_companies where user_id = auth.uid())
    )
  );

-- ============ QUE VALIDAR DESPUES DE APLICAR ============
-- 1. Analizar una wallet nueva en /blockchain y /tracking: debe guardarse.
-- 2. Vincular un analisis de wallet a un caso en /tracking: debe funcionar
--    y, con un segundo usuario de OTRA empresa, no debe ver esos analisis.
-- 3. Ver la cadena de custodia en /dashboard/audit para un caso real: antes
--    probablemente aparecia vacia por el bug de forensic_cases; ahora debe
--    mostrar los eventos de ese caso.
-- 4. Subir evidencia en el reporte de un caso (/reports/[caseId]): cualquier
--    usuario autenticado miembro de la empresa del caso puede subir, editar
--    o borrar evidencia (ya no se exige rol ADMIN/AUDITOR).