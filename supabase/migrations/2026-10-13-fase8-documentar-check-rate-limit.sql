-- Fase 8 (Robustez de Plataforma): archiva en el repositorio la funcion
-- check_rate_limit, que ya esta corriendo en produccion y es usada por 15+
-- rutas de la API (apu-suggest, chat-query, subscriptions/paypal-confirm,
-- ar-invoices/paypal-confirm, detect-arbitrage, etc.), pero cuyo codigo
-- fuente nunca habia llegado al repo -- solo la tabla que usa
-- (api_rate_limits) estaba documentada (ver
-- 2026-10-12-baseline-schema-documentation.sql). Sin esto, si el proyecto
-- de Supabase se tuviera que reconstruir desde cero, no habria forma de
-- recrear esta funcion a partir del repositorio.
--
-- Contenido verificado contra la funcion real en produccion via
-- "select pg_get_functiondef(oid) from pg_proc where proname =
-- 'check_rate_limit';" -- se transcribe exactamente, sin corregir la
-- primera asignacion de current_window (muerta, la sobreescribe la
-- siguiente linea de inmediato) porque este archivo documenta el
-- comportamiento real existente, no lo mejora.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_endpoint text, p_max_requests integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  current_window timestamptz;
  current_count integer;
begin
  current_window := date_trunc('minute', now()) - (extract(epoch from (date_trunc('minute', now()) - now()))::int % p_window_seconds) * interval '1 second';
  current_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into api_rate_limits (user_id, endpoint, window_start, request_count)
  values (auth.uid(), p_endpoint, current_window, 1)
  on conflict (user_id, endpoint, window_start)
  do update set request_count = api_rate_limits.request_count + 1
  returning request_count into current_count;

  return current_count <= p_max_requests;
end;
$function$;