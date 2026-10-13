-- Fase 8 (Robustez de Plataforma): limite de solicitudes para el
-- formulario de contacto publico (app/api/contact/route.ts).
--
-- Hallazgo de auditoria: el patron de rate limiting ya usado en 15+ rutas
-- (RPC check_rate_limit sobre la tabla api_rate_limits) depende de
-- auth.uid() -- requiere una sesion iniciada. El formulario de contacto es
-- deliberadamente publico (nadie inicia sesion antes de escribir), asi que
-- ese patron no aplica aqui: sin ningun limite, un script podia bombardear
-- /api/contact y llenar la tabla contact_submissions o saturar el envio de
-- notificaciones. Se crea un limite propio, contado por IP en vez de por
-- usuario.
create table if not exists public.contact_rate_limits (
  ip text not null,
  window_start timestamp with time zone not null,
  request_count integer not null default 1,
  primary key (ip, window_start)
);

-- Ninguna politica de RLS a proposito: ni anon ni authenticated pueden
-- leer o escribir esta tabla directamente. El unico acceso es a traves de
-- la funcion de abajo (security definer), igual que external_api_keys en
-- las rutas de partners (ver app/api/feed/*).
alter table public.contact_rate_limits enable row level security;

-- Ventana fija (no deslizante): se cuenta cuantas solicitudes de esta IP
-- caen en el bucket de p_window_seconds actual. Mismo enfoque que el
-- check_rate_limit existente, solo que por IP en vez de por usuario, y
-- definido aqui en su totalidad (no se esta adivinando la implementacion
-- de check_rate_limit, que ya existe en Supabase pero no tiene su fuente
-- en este repo -- ver nota aparte para Javiel).
create or replace function public.check_contact_rate_limit(p_ip text, p_max_requests integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamp with time zone;
  v_count integer;
begin
  if p_ip is null or p_ip = '' then
    return false;
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.contact_rate_limits (ip, window_start, request_count)
  values (p_ip, v_window_start, 1)
  on conflict (ip, window_start)
  do update set request_count = public.contact_rate_limits.request_count + 1
  returning request_count into v_count;

  -- Limpieza perezosa: borra buckets viejos (de mas de 1 hora) en cada
  -- llamada, para que la tabla no crezca sin limite. No hace falta un cron
  -- aparte para esto -- el volumen de este formulario es bajo.
  delete from public.contact_rate_limits where window_start < now() - interval '1 hour';

  return v_count <= p_max_requests;
end;
$$;

grant execute on function public.check_contact_rate_limit(text, integer, integer) to anon, authenticated;