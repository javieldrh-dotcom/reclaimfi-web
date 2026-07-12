-- Migracion: Motor REPOMO Automatico (trigger)
-- Fecha: 2026-07-12

-- Se dispara automaticamente con cada linea de asiento contable insertada.
-- Busca el country_code de la empresa, encuentra sus indices de precios
-- (price_indices), calcula la posicion monetaria y el REPOMO del periodo,
-- y actualiza (no duplica) el registro del dia en repomo_calculations.

create or replace function calculate_repomo_automatic()
returns trigger
language plpgsql
security definer
as $$
declare
  v_company_id uuid;
  v_country text;
  v_base_index numeric;
  v_closing_index numeric;
  v_monetary_assets numeric;
  v_monetary_liabilities numeric;
  v_position numeric;
  v_inflation_rate numeric;
  v_repomo numeric;
begin
  select coa.company_id into v_company_id
  from chart_of_accounts coa
  where coa.id = new.account_id;

  if v_company_id is null then
    return new;
  end if;

  select country into v_country from companies where id = v_company_id;

  if v_country is null then
    return new;
  end if;

  select index_value into v_base_index
  from price_indices
  where country_code = v_country
  order by period_date asc
  limit 1;

  select index_value into v_closing_index
  from price_indices
  where country_code = v_country
  order by period_date desc
  limit 1;

  if v_base_index is null or v_closing_index is null or v_base_index = 0 then
    return new;
  end if;

  select
    coalesce(sum(case when coa.monetary_type = 'MONETARY' and coa.account_type = 'ASSET' then jl.debit - jl.credit else 0 end), 0),
    coalesce(sum(case when coa.monetary_type = 'MONETARY' and coa.account_type = 'LIABILITY' then jl.credit - jl.debit else 0 end), 0)
  into v_monetary_assets, v_monetary_liabilities
  from journal_lines jl
  join chart_of_accounts coa on coa.id = jl.account_id
  where coa.company_id = v_company_id;

  v_position := v_monetary_assets - v_monetary_liabilities;
  v_inflation_rate := (v_closing_index - v_base_index) / v_base_index;
  v_repomo := v_position * v_inflation_rate * -1;

  delete from repomo_calculations
  where company_id = v_company_id and period_date = current_date;

  insert into repomo_calculations (
    company_id, period_date, monetary_assets, monetary_liabilities,
    monetary_position, inflation_rate, repomo_result, result_type
  ) values (
    v_company_id, current_date, v_monetary_assets, v_monetary_liabilities,
    v_position, v_inflation_rate, v_repomo,
    case when v_repomo < 0 then 'PERDIDA' else 'GANANCIA' end
  );

  return new;
end;
$$;

create trigger trg_repomo_on_journal_line
after insert on journal_lines
for each row
execute function calculate_repomo_automatic();

-- NOTA: requiere que companies.country coincida exactamente con
-- price_indices.country_code (ej. 'VE') para que el calculo se dispare.
-- Si no hay indices cargados para el pais de la empresa, el trigger
-- no falla, simplemente no calcula (return new sin insertar).

-- PENDIENTE: extender a los 3 estados financieros restantes
-- (aplicar factor de reexpresion a partidas NO_MONETARY, no solo
-- calcular el REPOMO de las MONETARY)