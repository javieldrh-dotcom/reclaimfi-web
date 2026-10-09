-- wallet_addresses no tenia ninguna columna de aislamiento por empresa
-- (ni company_id, ni user_id, ni case_id), por lo que cualquier usuario de
-- cualquier empresa en la plataforma veia el historial y las alertas de
-- TODAS las wallets analizadas por TODAS las empresas. Esta migracion
-- agrega company_id para permitir aislar los datos por empresa, igual que
-- en cases/alerts.
--
-- Las filas existentes no se pueden reasignar con certeza a una empresa
-- (no hay ninguna relacion previa registrada), por lo que quedan con
-- company_id = NULL. El codigo de la aplicacion filtra por company_id, asi
-- que esas filas antiguas dejaran de aparecer en los listados por empresa
-- hasta que, si se desea, se reasignen manualmente. Los nuevos analisis de
-- wallet (app/blockchain/page.tsx) ya guardan company_id desde el momento
-- en que se aplica esta migracion.

alter table public.wallet_addresses
  add column if not exists company_id uuid references public.companies(id);

create index if not exists wallet_addresses_company_id_idx
  on public.wallet_addresses (company_id);
