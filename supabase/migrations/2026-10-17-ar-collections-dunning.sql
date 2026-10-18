-- AR collections / dunning (gestion de cobranza de Cuentas por Cobrar
-- vencidas). Dos piezas reales que faltaban, confirmadas revisando el
-- codigo actual de app/accounting/ar-invoices/page.tsx:
--
-- 1) El status "OVERDUE" ya existia en la restriccion CHECK de
--    ar_invoices.status y la UI ya sabia mostrarlo (color amarillo, boton
--    de cobro habilitado), pero NADA en todo el repositorio lo asignaba
--    jamas -- una factura vencida se quedaba en PENDING para siempre. Se
--    agrega un cron diario (ver app/api/cron/mark-overdue-invoices) que
--    hace esa transicion automaticamente.
-- 2) No existia ningun lugar para registrar gestiones de cobranza
--    (recordatorio enviado, llamada, promesa de pago) por factura. Se
--    agrega ar_collection_activity para eso -- una bitacora simple, no un
--    modulo de email automatico (este proyecto no tiene ningun proveedor
--    de email configurado todavia; automatizar el ENVIO habria creado la
--    misma dependencia externa sin resolver que bloqueo Binance Pay).

create table if not exists public.ar_collection_activity (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  ar_invoice_id uuid not null references public.ar_invoices(id) on delete cascade,
  activity_type text not null check (activity_type in ('REMINDER_SENT', 'CALL', 'PROMISE_TO_PAY', 'NOTE')),
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create index if not exists ar_collection_activity_invoice_idx on public.ar_collection_activity (ar_invoice_id, created_at desc);
create index if not exists ar_collection_activity_company_idx on public.ar_collection_activity (company_id);

alter table public.ar_collection_activity enable row level security;

-- Mismo patron de RLS que ar_invoices (ver migracion baseline, tabla
-- ar_invoices): cualquier miembro de la empresa puede LEER la bitacora de
-- cobranza, pero solo ADMIN/CONTADOR pueden escribir en ella -- es
-- informacion financiera sensible (quien debe, cuanto, que gestion se hizo).
drop policy if exists "company_isolation_select" on public.ar_collection_activity;
create policy "company_isolation_select" on public.ar_collection_activity
  for select to public using (is_company_member(company_id));

drop policy if exists "write_admin_contador_insert" on public.ar_collection_activity;
create policy "write_admin_contador_insert" on public.ar_collection_activity
  for insert to public with check (
    is_company_member(company_id) and (get_user_role(company_id) = any (array['ADMIN'::text, 'CONTADOR'::text]))
  );

drop policy if exists "write_admin_contador_delete" on public.ar_collection_activity;
create policy "write_admin_contador_delete" on public.ar_collection_activity
  for delete to public using (
    is_company_member(company_id) and (get_user_role(company_id) = any (array['ADMIN'::text, 'CONTADOR'::text]))
  );
-- No hace falta policy de "update": una gestion de cobranza registrada no
-- se edita, se agrega una nueva entrada (igual que una nota de auditoria).
