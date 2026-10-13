-- Fase 6 (Ciclo de Ventas Completo), primera entrega: cotizaciones/presupuestos
-- de venta. Hoy el modulo de Cuentas por Cobrar (ar_invoices) solo permite
-- registrar una factura ya emitida -- no hay forma de preparar una
-- cotizacion para un cliente, darle seguimiento, y convertirla en factura
-- (con su asiento contable) solo cuando el cliente la acepta. Se modela
-- igual que ar_invoices (monto unico, sin lineas de detalle) para mantener
-- consistencia con el resto del modulo de ventas; una cotizacion con
-- lineas de detalle queda para una fase posterior si se necesita.
create table if not exists public.sales_estimates (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  customer_name text not null,
  estimate_number text not null,
  issue_date date not null,
  expiry_date date,
  amount numeric not null,
  status text not null default 'DRAFT',
  notes text,
  converted_invoice_id uuid references public.ar_invoices(id),
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.sales_estimates drop constraint if exists sales_estimates_status_check;
alter table public.sales_estimates add constraint sales_estimates_status_check
  check (status = any (array['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']));

alter table public.sales_estimates enable row level security;

drop policy if exists "company_isolation_select" on public.sales_estimates;
create policy "company_isolation_select" on public.sales_estimates for select to public
  using (is_company_member(company_id));

drop policy if exists "write_admin_contador_insert" on public.sales_estimates;
create policy "write_admin_contador_insert" on public.sales_estimates for insert to public
  with check (is_company_member(company_id) and get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']));

drop policy if exists "write_admin_contador_update" on public.sales_estimates;
create policy "write_admin_contador_update" on public.sales_estimates for update to public
  using (is_company_member(company_id) and get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']));

drop policy if exists "write_admin_contador_delete" on public.sales_estimates;
create policy "write_admin_contador_delete" on public.sales_estimates for delete to public
  using (is_company_member(company_id) and get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']));