-- Reconstruccion de esta migracion a partir del codigo REAL que existe hoy
-- en produccion (confirmado via introspeccion contra pg_proc/pg_trigger el
-- 2026-10-15). El archivo original solo contenia la consulta de
-- introspeccion usada para generar esto, nunca el DDL real -- quedo
-- documentado en el repo como un placeholder sin ejecutar. Este archivo
-- reemplaza ese contenido con la definicion real, de forma idempotente
-- (CREATE OR REPLACE / DROP TRIGGER IF EXISTS) para poder correrlo de
-- nuevo sin error contra una base de datos que ya tiene esta funcion.
--
-- Que hace: bloquea cualquier INSERT/UPDATE (y DELETE en journal_lines)
-- sobre un asiento de diario cuya fecha caiga dentro de un fiscal_periods
-- con status = 'CLOSED' para esa misma empresa.

create or replace function public.check_period_not_closed()
returns trigger
language plpgsql
as $function$
declare
  v_company_id uuid;
  v_entry_date date;
  v_closed_period record;
begin
  if tg_table_name = 'journal_entries' then
    v_company_id := new.company_id;
    v_entry_date := new.entry_date;
  elsif tg_table_name = 'journal_lines' then
    select je.company_id, je.entry_date into v_company_id, v_entry_date
    from public.journal_entries je
    where je.id = coalesce(new.journal_entry_id, old.journal_entry_id);
  end if;

  if v_company_id is null or v_entry_date is null then
    return coalesce(new, old);
  end if;

  select fp.period_start, fp.period_end into v_closed_period
  from public.fiscal_periods fp
  where fp.company_id = v_company_id
    and fp.status = 'CLOSED'
    and fp.period_start <= v_entry_date
    and fp.period_end >= v_entry_date
  limit 1;

  if found then
    raise exception 'No se puede modificar un asiento del periodo fiscal cerrado (% a %)', v_closed_period.period_start, v_closed_period.period_end
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_check_period_not_closed_journal_entries on public.journal_entries;
create trigger trg_check_period_not_closed_journal_entries
  before insert or update on public.journal_entries
  for each row execute function public.check_period_not_closed();

drop trigger if exists trg_check_period_not_closed_journal_lines on public.journal_lines;
create trigger trg_check_period_not_closed_journal_lines
  before insert or delete or update on public.journal_lines
  for each row execute function public.check_period_not_closed();