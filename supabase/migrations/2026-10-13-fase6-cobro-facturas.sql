-- Fase 6 (Ciclo de Ventas Completo), tercera entrega: cobro de facturas
-- (online y manual).
--
-- Hallazgo de auditoria al revisar este flujo: la funcion markAsPaid() en
-- ar-invoices/page.tsx (y su equivalente en ap-bills) SOLO cambiaba la
-- columna status a 'PAID' -- nunca generaba el asiento contable del cobro
-- (debito a Caja/Banco, credito a Cuentas por Cobrar). Esto significa que
-- el saldo de CxC en el Libro Mayor nunca bajaba aunque la factura se
-- marcara pagada: el estado visual decia "Pagada" pero la contabilidad
-- seguia mostrando la cuenta por cobrar abierta. Esta migracion agrega las
-- columnas necesarias para que el cobro (manual o via PayPal) quede
-- enlazado a una cuenta de caja/banco real y se pueda generar su asiento.
-- El fix del flujo en si (generar el asiento al cobrar) va en el codigo
-- de la aplicacion, no aqui -- esta migracion solo prepara el esquema.
alter table public.ar_invoices
  add column if not exists payment_account_id uuid references public.chart_of_accounts(id),
  add column if not exists paid_amount numeric,
  add column if not exists paid_at timestamp with time zone,
  add column if not exists payment_method text;

alter table public.ar_invoices
  add column if not exists paypal_order_id text;

-- Un mismo ID de orden de PayPal no puede usarse para "pagar" dos facturas
-- distintas (protege contra reutilizar la confirmacion de un pago ya
-- capturado). Parcial (where not null) porque los cobros manuales no
-- tienen paypal_order_id.
create unique index if not exists ar_invoices_paypal_order_id_key
  on public.ar_invoices (paypal_order_id)
  where paypal_order_id is not null;