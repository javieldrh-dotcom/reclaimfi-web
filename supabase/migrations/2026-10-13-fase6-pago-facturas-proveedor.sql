-- Mismo defecto que se encontro y corrigio en ar_invoices (ver
-- 2026-10-13-fase6-cobro-facturas.sql), espejo en Cuentas por Pagar:
-- markAsPaid() en ap-bills/page.tsx solo cambiaba status a 'PAID' sin
-- generar el asiento de desembolso (debito a la cuenta de Cuentas por
-- Pagar original, credito a la cuenta de caja/banco que realmente pago).
-- El saldo de CxP en el Libro Mayor nunca bajaba aunque la factura se
-- marcara "Pagada". No se agrega flujo de cobro online (PayPal) aqui --
-- pagar a un proveedor no es un "cobro" que el proveedor inicie desde la
-- plataforma, es un desembolso que decide la propia empresa, por lo que
-- solo aplica el flujo manual.
alter table public.ap_bills
  add column if not exists payment_account_id uuid references public.chart_of_accounts(id),
  add column if not exists paid_amount numeric,
  add column if not exists paid_at timestamp with time zone,
  add column if not exists payment_method text;