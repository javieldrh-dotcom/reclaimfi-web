-- Fase 6 (Ciclo de Ventas Completo), segunda entrega: plantillas de
-- facturacion recurrente. Para clientes con cargos periodicos fijos
-- (suscripciones, alquileres, retainers, etc.) hoy hay que crear cada
-- factura de ar_invoices a mano, mes por mes. Esta tabla guarda la
-- plantilla (cliente, monto, cuentas contables, frecuencia) y una fecha
-- "next_run_date" que se va avanzando cada vez que se genera una factura
-- -- asi el generador (automatico via cron, o manual desde la UI) sabe
-- exactamente que plantillas estan vencidas sin tener que recalcular nada.
create table if not exists public.recurring_invoice_templates (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  customer_name text not null,
  description text,
  amount numeric not null,
  ar_account_id uuid not null references public.chart_of_accounts(id),
  revenue_account_id uuid not null references public.chart_of_accounts(id),
  frequency text not null default 'MONTHLY',
  start_date date not null,
  next_run_date date not null,
  end_date date,
  is_active boolean not null default true,
  last_generated_invoice_id uuid references public.ar_invoices(id),
  last_generated_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.recurring_invoice_templates drop constraint if exists recurring_invoice_templates_frequency_check;
alter table public.recurring_invoice_templates add constraint recurring_invoice_templates_frequency_check
  check (frequency = any (array['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']));

alter table public.recurring_invoice_templates enable row level security;

drop policy if exists "company_isolation_select" on public.recurring_invoice_templates;
create policy "company_isolation_select" on public.recurring_invoice_templates for select to public
  using (is_company_member(company_id));

drop policy if exists "write_admin_contador_insert" on public.recurring_invoice_templates;
create policy "write_admin_contador_insert" on public.recurring_invoice_templates for insert to public
  with check (is_company_member(company_id) and get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']));

drop policy if exists "write_admin_contador_update" on public.recurring_invoice_templates;
create policy "write_admin_contador_update" on public.recurring_invoice_templates for update to public
  using (is_company_member(company_id) and get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']));

drop policy if exists "write_admin_contador_delete" on public.recurring_invoice_templates;
create policy "write_admin_contador_delete" on public.recurring_invoice_templates for delete to public
  using (is_company_member(company_id) and get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']));