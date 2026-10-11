-- =====================================================================
-- Fix 1: "evidences" tenia politicas duplicadas por comando que se
-- combinan con OR (permisivas) -- la misma clase de regresion que ya
-- corregimos en apu_financial_qualification: las versiones
-- "_own_company" (sin restriccion de rol) anulaban en la practica a
-- las versiones "_admin_auditor" (ADMIN/AUDITOR). Se eliminan las
-- abiertas; las restringidas ya cubren insert/update/delete. La
-- lectura (evidences_select_own_company) se deja intacta,
-- intencionalmente abierta a cualquier miembro de la empresa.
-- =====================================================================
drop policy if exists evidences_insert_own_company on public.evidences;
drop policy if exists evidences_update_own_company on public.evidences;
drop policy if exists evidences_delete_own_company on public.evidences;

-- =====================================================================
-- Fix 2: "approvals" solo permitia ADMIN/AUDITOR, pero esta tabla ya se
-- usa (Fase 2) para flujos de contabilidad (adjudicacion APU, cierre de
-- ejercicio) donde el responsable tipico es ADMIN/CONTADOR. Un usuario
-- CONTADOR-no-ADMIN podia registrar los asientos reales
-- (chart_of_accounts/journal_entries ya permiten ADMIN+CONTADOR) pero
-- su escritura en "approvals" quedaba bloqueada en silencio por RLS, de
-- modo que la solicitud se queda eternamente en PENDING aunque el
-- cierre/adjudicacion ya se haya registrado de verdad. Se ampliar a
-- ADMIN, AUDITOR o CONTADOR (se excluye SOLO_LECTURA a proposito).
-- =====================================================================
drop policy if exists write_admin_auditor_insert on public.approvals;
drop policy if exists write_admin_auditor_update on public.approvals;
drop policy if exists write_admin_auditor_delete on public.approvals;

create policy write_admin_auditor_contador_insert on public.approvals
  for insert
  with check (
    is_company_member(company_id)
    and get_user_role(company_id) = any (array['ADMIN','AUDITOR','CONTADOR'])
  );

create policy write_admin_auditor_contador_update on public.approvals
  for update
  using (
    is_company_member(company_id)
    and get_user_role(company_id) = any (array['ADMIN','AUDITOR','CONTADOR'])
  );

create policy write_admin_auditor_contador_delete on public.approvals
  for delete
  using (
    is_company_member(company_id)
    and get_user_role(company_id) = any (array['ADMIN','AUDITOR','CONTADOR'])
  );

-- =====================================================================
-- Fix 3 (Fase 2, tercera pieza): maker-checker para la reconstruccion
-- contable forense. confirmReconstruction() en
-- app/reports/[caseId]/reconstruct/page.tsx crea hoy una empresa nueva
-- y asienta partida doble completa de un solo clic -- el mismo patron
-- de riesgo que ya corregimos en adjudicacion APU y cierre de
-- ejercicio. A diferencia de esas dos, aqui no existe una fila previa
-- en una tabla de negocio que se pueda marcar PENDING (la
-- "reconstruccion" es solo un estado de UI hasta que se confirma), asi
-- que se guarda el payload completo (transacciones ya editadas por el
-- usuario) en una tabla nueva.
-- =====================================================================
create table if not exists public.reconstruction_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  company_id uuid not null,
  company_name text not null,
  transactions jsonb not null,
  status text not null default 'PENDING',
  requested_by uuid not null,
  approved_by uuid,
  created_at timestamptz not null default now()
);

alter table public.reconstruction_requests enable row level security;

create policy reconstruction_requests_select on public.reconstruction_requests
  for select using (is_company_member(company_id));

create policy reconstruction_requests_insert on public.reconstruction_requests
  for insert with check (is_company_member(company_id));

-- Confirmar/rechazar: solo quien de verdad puede registrar los asientos
-- reales (chart_of_accounts/journal_entries exigen ADMIN+CONTADOR), asi
-- que el update de esta tabla se restringe igual.
create policy reconstruction_requests_update on public.reconstruction_requests
  for update using (
    is_company_member(company_id)
    and get_user_role(company_id) = any (array['ADMIN','CONTADOR'])
  );
