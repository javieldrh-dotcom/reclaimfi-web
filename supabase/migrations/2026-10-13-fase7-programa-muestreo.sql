-- Fase 7 (Metodologia de Auditoria Profesional), segunda entrega:
-- programa de auditoria (con trazabilidad preparador/revisor) y muestreo.
-- Continua directamente sobre materialidad y riesgo por asercion (ver
-- 2026-10-13-fase7-materialidad-riesgo.sql): un procedimiento de auditoria
-- sin saber antes la materialidad ni el riesgo de la asercion que ataca
-- es solo una lista de tareas sin fundamento tecnico.

-- Programa de auditoria: lista de procedimientos planificados por area,
-- cada uno con su propio ciclo preparador -> revisor (requisito basico de
-- control de calidad en auditoria: nadie revisa su propio trabajo).
create table if not exists public.audit_program_procedures (
  id uuid not null default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  area text not null,
  assertion text,
  procedure_type text not null default 'SUSTANTIVA',
  description text not null,
  status text not null default 'PENDIENTE',
  conclusion text,
  prepared_by uuid references auth.users(id),
  prepared_at timestamp with time zone,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.audit_program_procedures drop constraint if exists audit_program_procedures_type_check;
alter table public.audit_program_procedures add constraint audit_program_procedures_type_check
  check (procedure_type = any (array['SUSTANTIVA', 'CONTROL']));

alter table public.audit_program_procedures drop constraint if exists audit_program_procedures_status_check;
alter table public.audit_program_procedures add constraint audit_program_procedures_status_check
  check (status = any (array['PENDIENTE', 'EN_PROCESO', 'COMPLETADO']));

alter table public.audit_program_procedures drop constraint if exists audit_program_procedures_assertion_check;
alter table public.audit_program_procedures add constraint audit_program_procedures_assertion_check
  check (assertion is null or assertion = any (array['EXISTENCIA', 'INTEGRIDAD', 'VALUACION', 'DERECHOS_OBLIGACIONES', 'PRESENTACION_REVELACION']));

-- Un procedimiento no puede marcarse revisado por la misma persona que lo
-- preparo -- es la base de la segregacion de funciones en auditoria.
-- Postgres no puede comparar columnas en un check si alguna es null sin
-- volverse verdadero trivialmente, por eso el check explicitamente deja
-- pasar el caso "todavia no hay revisor".
alter table public.audit_program_procedures drop constraint if exists audit_program_procedures_reviewer_not_preparer_check;
alter table public.audit_program_procedures add constraint audit_program_procedures_reviewer_not_preparer_check
  check (reviewed_by is null or prepared_by is null or reviewed_by <> prepared_by);

create index if not exists audit_program_procedures_case_id_idx on public.audit_program_procedures (case_id);

alter table public.audit_program_procedures enable row level security;

drop policy if exists "select_via_case" on public.audit_program_procedures;
create policy "select_via_case" on public.audit_program_procedures for select to public
  using (exists (select 1 from public.cases c where c.id = audit_program_procedures.case_id and is_company_member(c.company_id)));

drop policy if exists "write_admin_auditor_insert" on public.audit_program_procedures;
create policy "write_admin_auditor_insert" on public.audit_program_procedures for insert to public
  with check (exists (select 1 from public.cases c where c.id = audit_program_procedures.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_update" on public.audit_program_procedures;
create policy "write_admin_auditor_update" on public.audit_program_procedures for update to public
  using (exists (select 1 from public.cases c where c.id = audit_program_procedures.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_delete" on public.audit_program_procedures;
create policy "write_admin_auditor_delete" on public.audit_program_procedures for delete to public
  using (exists (select 1 from public.cases c where c.id = audit_program_procedures.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

-- Muestreo: por ahora solo la CALCULADORA del tamano de muestra (Muestreo
-- de Unidades Monetarias / MUS, cero errores esperados -- el metodo
-- estandar de la guia de muestreo de AICPA), enlazada opcionalmente a un
-- procedimiento del programa. NO incluye todavia "caminar la poblacion y
-- seleccionar los items" contra transacciones reales -- eso requeriria
-- definir de que tabla sale la poblacion (journal_lines? ap_bills?
-- ar_invoices? depende del area), y se deja fuera de esta entrega a
-- proposito en vez de improvisar una poblacion que no se pidio.
create table if not exists public.audit_sampling_plans (
  id uuid not null default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  area text not null,
  procedure_id uuid references public.audit_program_procedures(id),
  population_description text,
  population_amount numeric not null,
  tolerable_misstatement numeric not null,
  confidence_level numeric not null default 95,
  reliability_factor numeric not null,
  sample_size integer not null,
  sampling_interval numeric not null,
  notes text,
  prepared_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  primary key (id)
);

create index if not exists audit_sampling_plans_case_id_idx on public.audit_sampling_plans (case_id);

alter table public.audit_sampling_plans enable row level security;

drop policy if exists "select_via_case" on public.audit_sampling_plans;
create policy "select_via_case" on public.audit_sampling_plans for select to public
  using (exists (select 1 from public.cases c where c.id = audit_sampling_plans.case_id and is_company_member(c.company_id)));

drop policy if exists "write_admin_auditor_insert" on public.audit_sampling_plans;
create policy "write_admin_auditor_insert" on public.audit_sampling_plans for insert to public
  with check (exists (select 1 from public.cases c where c.id = audit_sampling_plans.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_update" on public.audit_sampling_plans;
create policy "write_admin_auditor_update" on public.audit_sampling_plans for update to public
  using (exists (select 1 from public.cases c where c.id = audit_sampling_plans.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_delete" on public.audit_sampling_plans;
create policy "write_admin_auditor_delete" on public.audit_sampling_plans for delete to public
  using (exists (select 1 from public.cases c where c.id = audit_sampling_plans.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));