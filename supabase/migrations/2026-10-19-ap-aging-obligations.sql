-- Antiguedad de Cuentas por Pagar (AP aging) -- el espejo de la cobranza
-- de AR que se agrego el 2026-10-17. Mismo hallazgo exacto, pero del lado
-- de lo que la empresa DEBE en vez de lo que le deben: la columna
-- ap_bills.status tiene "OVERDUE" permitido en su restriccion CHECK desde
-- siempre, pero nada en el repositorio lo asignaba jamas. Peor aun: el
-- boton de "Pagar" en app/accounting/ap-bills/page.tsx solo se mostraba
-- para status = 'PENDING' (no para 'OVERDUE'), asi que si una factura de
-- proveedor alguna vez hubiera llegado a OVERDUE, se habria vuelto
-- IMPOSIBLE pagarla desde la pantalla -- ese bug se corrigio en el mismo
-- commit que esta migracion, antes de activar el cron que efectivamente
-- empieza a asignar OVERDUE.

create table if not exists public.ap_payment_notes (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  ap_bill_id uuid not null references public.ap_bills(id) on delete cascade,
  activity_type text not null check (activity_type in ('PAYMENT_SCHEDULED', 'VENDOR_CONTACTED', 'DISPUTE', 'NOTE')),
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create index if not exists ap_payment_notes_bill_idx on public.ap_payment_notes (ap_bill_id, created_at desc);
create index if not exists ap_payment_notes_company_idx on public.ap_payment_notes (company_id);

alter table public.ap_payment_notes enable row level security;

-- Mismo patron de RLS que ar_collection_activity (select abierto a
-- cualquier miembro de la empresa, escritura solo ADMIN/CONTADOR).
drop policy if exists "company_isolation_select" on public.ap_payment_notes;
create policy "company_isolation_select" on public.ap_payment_notes
  for select to public using (is_company_member(company_id));

drop policy if exists "write_admin_contador_insert" on public.ap_payment_notes;
create policy "write_admin_contador_insert" on public.ap_payment_notes
  for insert to public with check (
    is_company_member(company_id) and (get_user_role(company_id) = any (array['ADMIN'::text, 'CONTADOR'::text]))
  );

drop policy if exists "write_admin_contador_delete" on public.ap_payment_notes;
create policy "write_admin_contador_delete" on public.ap_payment_notes
  for delete to public using (
    is_company_member(company_id) and (get_user_role(company_id) = any (array['ADMIN'::text, 'CONTADOR'::text]))
  );