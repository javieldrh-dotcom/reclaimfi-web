-- Fase 7 (Metodologia de Auditoria Profesional), primera entrega:
-- materialidad y evaluacion de riesgo por asercion. Hoy el modulo de
-- auditoria (/dashboard/audit/financiero) solo tiene deteccion (cadena de
-- custodia, Benford, outliers) -- no hay ninguna fase de PLANIFICACION,
-- que es lo que distingue una auditoria con metodologia profesional (nivel
-- KPMG) de una simple herramienta de deteccion de anomalias. Sin
-- materialidad definida de antemano, cualquier hallazgo es subjetivo: no
-- hay forma de decir si una diferencia de $500 es relevante o no para ESE
-- caso especifico.
--
-- Mismo patron de RLS que evidences/ai_findings (ver baseline): las
-- politicas resuelven la empresa a traves de cases.company_id, y la
-- escritura requiere ADMIN o AUDITOR (no CONTADOR -- la planificacion de
-- auditoria es responsabilidad del auditor, no del contador que lleva la
-- contabilidad del cliente; mezclar esos roles anularia la independencia
-- que se esta intentando demostrar).
create table if not exists public.audit_materiality (
  id uuid not null default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  benchmark_type text not null,
  benchmark_amount numeric not null,
  materiality_percentage numeric not null,
  materiality_amount numeric not null,
  performance_materiality_percentage numeric not null default 75,
  performance_materiality_amount numeric not null,
  trivial_threshold_amount numeric not null,
  notes text,
  prepared_by uuid references auth.users(id),
  prepared_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.audit_materiality drop constraint if exists audit_materiality_benchmark_type_check;
alter table public.audit_materiality add constraint audit_materiality_benchmark_type_check
  check (benchmark_type = any (array['INGRESOS', 'ACTIVOS_TOTALES', 'UTILIDAD_NETA', 'PATRIMONIO']));

-- Una sola materialidad "vigente" por caso -- recalcular la materialidad
-- de un caso reemplaza la anterior en vez de acumular filas sueltas que
-- despues no se sabe cual es la que realmente se uso. Si se necesita
-- historial de revisiones de materialidad en el futuro, se agrega una
-- tabla de versiones aparte; no se resuelve aqui con un workaround.
create unique index if not exists audit_materiality_case_id_key on public.audit_materiality (case_id);

alter table public.audit_materiality enable row level security;

drop policy if exists "select_via_case" on public.audit_materiality;
create policy "select_via_case" on public.audit_materiality for select to public
  using (exists (select 1 from public.cases c where c.id = audit_materiality.case_id and is_company_member(c.company_id)));

drop policy if exists "write_admin_auditor_insert" on public.audit_materiality;
create policy "write_admin_auditor_insert" on public.audit_materiality for insert to public
  with check (exists (select 1 from public.cases c where c.id = audit_materiality.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_update" on public.audit_materiality;
create policy "write_admin_auditor_update" on public.audit_materiality for update to public
  using (exists (select 1 from public.cases c where c.id = audit_materiality.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_delete" on public.audit_materiality;
create policy "write_admin_auditor_delete" on public.audit_materiality for delete to public
  using (exists (select 1 from public.cases c where c.id = audit_materiality.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

-- Evaluacion de riesgo por area x asercion -- las 5 aserciones clasicas de
-- auditoria financiera (ISA 315 / NIA 315): Existencia, Integridad,
-- Valuacion, Derechos y Obligaciones, Presentacion y Revelacion. Una fila
-- por combinacion area+asercion dentro de un caso.
create table if not exists public.audit_risk_assessments (
  id uuid not null default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  area text not null,
  assertion text not null,
  inherent_risk text not null,
  control_risk text not null,
  combined_risk text not null,
  planned_response text,
  prepared_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.audit_risk_assessments drop constraint if exists audit_risk_assessments_assertion_check;
alter table public.audit_risk_assessments add constraint audit_risk_assessments_assertion_check
  check (assertion = any (array['EXISTENCIA', 'INTEGRIDAD', 'VALUACION', 'DERECHOS_OBLIGACIONES', 'PRESENTACION_REVELACION']));

alter table public.audit_risk_assessments drop constraint if exists audit_risk_assessments_risk_levels_check;
alter table public.audit_risk_assessments add constraint audit_risk_assessments_risk_levels_check
  check (inherent_risk = any (array['ALTO', 'MEDIO', 'BAJO']) and control_risk = any (array['ALTO', 'MEDIO', 'BAJO']) and combined_risk = any (array['ALTO', 'MEDIO', 'BAJO']));

-- No se permite evaluar la misma area+asercion dos veces en el mismo caso
-- (se actualiza la fila existente en vez de duplicarla).
create unique index if not exists audit_risk_assessments_case_area_assertion_key
  on public.audit_risk_assessments (case_id, area, assertion);

alter table public.audit_risk_assessments enable row level security;

drop policy if exists "select_via_case" on public.audit_risk_assessments;
create policy "select_via_case" on public.audit_risk_assessments for select to public
  using (exists (select 1 from public.cases c where c.id = audit_risk_assessments.case_id and is_company_member(c.company_id)));

drop policy if exists "write_admin_auditor_insert" on public.audit_risk_assessments;
create policy "write_admin_auditor_insert" on public.audit_risk_assessments for insert to public
  with check (exists (select 1 from public.cases c where c.id = audit_risk_assessments.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_update" on public.audit_risk_assessments;
create policy "write_admin_auditor_update" on public.audit_risk_assessments for update to public
  using (exists (select 1 from public.cases c where c.id = audit_risk_assessments.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));

drop policy if exists "write_admin_auditor_delete" on public.audit_risk_assessments;
create policy "write_admin_auditor_delete" on public.audit_risk_assessments for delete to public
  using (exists (select 1 from public.cases c where c.id = audit_risk_assessments.case_id and is_company_member(c.company_id) and get_user_role(c.company_id) = any (array['ADMIN', 'AUDITOR'])));