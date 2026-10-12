-- Migracion: Motor REPOMO + Reexpresion por Inflacion Automatico (trigger)
-- Fecha: 2026-07-12
--
-- Se dispara automaticamente con cada linea de asiento contable insertada.
-- Busca el country_code de la empresa, encuentra sus indices de precios
-- (price_indices), calcula la posicion monetaria y el REPOMO del periodo
-- (cuentas MONETARY), y ademas reexpresa cada cuenta NO_MONETARY segun el
-- factor de inflacion (indice de cierre / indice base), guardando el
-- detalle en inflation_adjustments. Actualiza (no duplica) el registro del
-- dia tanto en repomo_calculations como en inflation_adjustments.
--
-- NOTA HISTORICA: esta es la version final de la funcion, ya extendida
-- para cubrir NO_MONETARY (la primera version, del mismo dia, solo
-- calculaba el REPOMO de las cuentas MONETARY). Verificado con datos
-- reales el 2026-07-12: 3 cuentas NO_MONETARY reexpresadas correctamente
-- con factor 1.3878 (inflacion 38.78% segun indices BCV 9.8 -> 13.6).

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
  v_factor numeric;
  r record;
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

  v_factor := v_closing_index / v_base_index;

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

  delete from inflation_adjustments
  where company_id = v_company_id and period_date = current_date;

  for r in
    select
      coa.id as account_id,
      coalesce(sum(case when coa.account_type = 'ASSET' then jl.debit - jl.credit else jl.credit - jl.debit end), 0) as base_amount
    from chart_of_accounts coa
    join journal_lines jl on jl.account_id = coa.id
    where coa.company_id = v_company_id and coa.monetary_type = 'NON_MONETARY'
    group by coa.id
    having coalesce(sum(case when coa.account_type = 'ASSET' then jl.debit - jl.credit else jl.credit - jl.debit end), 0) != 0
  loop
    insert into inflation_adjustments (
      company_id, account_id, period_date, base_amount, base_index,
      closing_index, reexpression_factor, reexpressed_amount, reexpression_effect
    ) values (
      v_company_id, r.account_id, current_date, r.base_amount, v_base_index,
      v_closing_index, v_factor, r.base_amount * v_factor, (r.base_amount * v_factor) - r.base_amount
    );
  end loop;

  return new;
end;
$$;

create or replace trigger trg_repomo_on_journal_line
after insert on journal_lines
for each row
execute function calculate_repomo_automatic();

-- NOTA: requiere que companies.country coincida exactamente con
-- price_indices.country_code (ej. 'VE') para que el calculo se dispare.
-- Si no hay indices cargados para el pais de la empresa, el trigger
-- no falla, simplemente no calcula (return new sin insertar).

-- PENDIENTE (para una futura sesion): conectar inflation_adjustments a
-- los 4 estados financieros para que muestren cifras ajustadas por
-- inflacion, no solo nominales (actualmente los estados usan el saldo
-- historico directo de journal_lines), y agregar una UI para visualizar
-- el detalle de reexpresion por cuenta (hoy solo vive en la tabla).