-- El filtro `filter: company_id=eq.<id>` que ahora usa
-- app/lib/realtime/realtimeGraphBridge.ts NO es una barrera de seguridad:
-- solo reduce lo que un cliente HONESTO recibe. Sin RLS en estas tablas,
-- cualquiera puede abrir las devtools, suscribirse a postgres_changes sin
-- filtro, y seguir recibiendo en tiempo real los cambios de TODAS las
-- empresas de la plataforma (cases, alerts). Esta migracion agrega la
-- barrera real a nivel de base de datos.
--
-- IMPORTANTE - LEER ANTES DE EJECUTAR:
-- Habilitar RLS en una tabla bloquea TODA operacion (select/insert/update/
-- delete) que no tenga una politica explicita que la permita, incluso para
-- quienes ya tenian acceso. Las politicas de abajo intentan cubrir
-- exactamente los mismos accesos que el codigo de la app ya hace hoy
-- (lectura/escritura solo de la propia empresa), pero esto es el mismo tipo
-- de cambio que hoy rompio produccion con la restriccion de
-- ap_bills.status: pruebalo primero en un entorno de staging o en una copia
-- de la base, y ten a mano el DROP POLICY / DISABLE ROW LEVEL SECURITY de
-- abajo para revertir rapido si algo se bloquea inesperadamente (por
-- ejemplo, una ruta de servidor que escribe con el cliente anonimo en vez
-- del cliente autenticado, o un flujo que todavia no tiene company_id
-- asignado en el momento de insertar).

-- ============ CASES ============
alter table public.cases enable row level security;

create policy "cases_select_own_company" on public.cases
  for select using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

create policy "cases_insert_own_company" on public.cases
  for insert with check (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

create policy "cases_update_own_company" on public.cases
  for update using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

create policy "cases_delete_own_company" on public.cases
  for delete using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

-- ============ ALERTS ============
alter table public.alerts enable row level security;

create policy "alerts_select_own_company" on public.alerts
  for select using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

create policy "alerts_insert_own_company" on public.alerts
  for insert with check (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

create policy "alerts_update_own_company" on public.alerts
  for update using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

create policy "alerts_delete_own_company" on public.alerts
  for delete using (
    company_id in (select company_id from public.user_companies where user_id = auth.uid())
  );

-- ============ ROLLBACK RAPIDO (si algo queda bloqueado) ============
-- alter table public.cases disable row level security;
-- alter table public.alerts disable row level security;