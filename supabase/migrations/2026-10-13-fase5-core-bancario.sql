-- Fase 5 del roadmap "ReclaimFi a nivel QuickBooks + KPMG": Core
-- Bancario. Primera pieza: el esquema de cuentas bancarias y sus
-- movimientos, con el mismo patron de RLS multi-tenant que el resto
-- de la plataforma (is_company_member/get_user_role, identico al de
-- ap_bills/ar_invoices -- ver 2026-10-12-baseline-schema-documentation.sql).
--
-- Diseno:
--   bank_accounts: una cuenta bancaria de la empresa, enlazada
--     opcionalmente a su cuenta del plan de cuentas (linked_account_id)
--     para que la conciliacion sepa contra que saldo contable comparar.
--   bank_transactions: un movimiento del estado de cuenta del banco
--     (importado), con external_id para evitar duplicados al
--     reimportar el mismo archivo, y matched_journal_line_id para
--     registrar la conciliacion contra el asiento contable real
--     cuando se encuentra o se confirma manualmente.
--
-- La logica de conciliacion (automatica por monto+fecha, manual para
-- el resto) y la pagina de UI son el siguiente paso de esta fase, no
-- parte de esta migracion.

create table if not exists public.bank_accounts (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  bank_name text not null,
  account_number text not null,
  account_type text not null default 'CORRIENTE',
  currency text not null default 'VES',
  linked_account_id uuid references public.chart_of_accounts(id),
  opening_balance numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.bank_accounts
  drop constraint if exists bank_accounts_account_type_check;
alter table public.bank_accounts
  add constraint bank_accounts_account_type_check
  check (account_type = any (array['CORRIENTE', 'AHORRO', 'OTRA']));

create table if not exists public.bank_transactions (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  bank_account_id uuid not null references public.bank_accounts(id),
  transaction_date date not null,
  description text,
  amount numeric not null,
  reference text,
  external_id text,
  matched_journal_line_id uuid references public.journal_lines(id),
  status text not null default 'UNMATCHED',
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.bank_transactions
  drop constraint if exists bank_transactions_status_check;
alter table public.bank_transactions
  add constraint bank_transactions_status_check
  check (status = any (array['UNMATCHED', 'MATCHED', 'IGNORED']));

-- Evita importar dos veces el mismo movimiento del mismo banco si se
-- vuelve a cargar el mismo archivo de estado de cuenta.
create unique index if not exists bank_transactions_dedupe
  on public.bank_transactions (bank_account_id, external_id)
  where external_id is not null;

-- ============ RLS: bank_accounts ============
alter table public.bank_accounts enable row level security;

drop policy if exists "company_isolation_select" on public.bank_accounts;
create policy "company_isolation_select" on public.bank_accounts
  for select to public using (is_company_member(company_id));

drop policy if exists "write_admin_contador_insert" on public.bank_accounts;
create policy "write_admin_contador_insert" on public.bank_accounts
  for insert to public with check (
    is_company_member(company_id)
    and (get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']))
  );

drop policy if exists "write_admin_contador_update" on public.bank_accounts;
create policy "write_admin_contador_update" on public.bank_accounts
  for update to public using (
    is_company_member(company_id)
    and (get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']))
  );

drop policy if exists "write_admin_contador_delete" on public.bank_accounts;
create policy "write_admin_contador_delete" on public.bank_accounts
  for delete to public using (
    is_company_member(company_id)
    and (get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']))
  );

-- ============ RLS: bank_transactions ============
alter table public.bank_transactions enable row level security;

drop policy if exists "company_isolation_select" on public.bank_transactions;
create policy "company_isolation_select" on public.bank_transactions
  for select to public using (is_company_member(company_id));

drop policy if exists "write_admin_contador_insert" on public.bank_transactions;
create policy "write_admin_contador_insert" on public.bank_transactions
  for insert to public with check (
    is_company_member(company_id)
    and (get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']))
  );

drop policy if exists "write_admin_contador_update" on public.bank_transactions;
create policy "write_admin_contador_update" on public.bank_transactions
  for update to public using (
    is_company_member(company_id)
    and (get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']))
  );

drop policy if exists "write_admin_contador_delete" on public.bank_transactions;
create policy "write_admin_contador_delete" on public.bank_transactions
  for delete to public using (
    is_company_member(company_id)
    and (get_user_role(company_id) = any (array['ADMIN', 'CONTADOR']))
  );