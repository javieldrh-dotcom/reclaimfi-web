import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Genera las facturas de ar_invoices que correspondan a las plantillas de
// recurring_invoice_templates vencidas (next_run_date <= hoy, is_active,
// y end_date nulo o aun no alcanzado). Pensada para correr sin usuario
// logueado (via Vercel Cron, ver vercel.json), por eso usa el service_role
// -- ninguna politica de RLS aplica aqui, asi que la unica proteccion es
// este chequeo de autorizacion.
//
// Vercel Cron envia automaticamente "Authorization: Bearer <CRON_SECRET>"
// en cada invocacion si la variable de entorno CRON_SECRET esta configurada
// en el proyecto (Project Settings -> Environment Variables). Sin esa
// variable configurada, esta ruta queda cerrada (devuelve 500) en vez de
// quedar abierta a cualquiera -- no hay "modo sin proteccion".
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === "Bearer " + secret;
}

function advanceDate(date: string, frequency: string): string {
  const d = new Date(date + "T00:00:00Z");
  if (frequency === "WEEKLY") d.setUTCDate(d.getUTCDate() + 7);
  else if (frequency === "QUARTERLY") d.setUTCMonth(d.getUTCMonth() + 3);
  else if (frequency === "ANNUAL") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1); // MONTHLY (default)
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);
  const { data: templates, error: templatesError } = await serviceClient
    .from("recurring_invoice_templates")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_date", today)
    .or("end_date.is.null,end_date.gte." + today);

  if (templatesError) {
    return NextResponse.json({ success: false, error: templatesError.message }, { status: 500 });
  }

  const results: any[] = [];

  for (const tpl of templates ?? []) {
    try {
      const { data: lastEntry } = await serviceClient
        .from("journal_entries")
        .select("entry_number")
        .eq("company_id", tpl.company_id)
        .eq("status", "ACTIVE")
        .not("entry_number", "is", null)
        .order("entry_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextNumber = (lastEntry?.entry_number || 0) + 1;

      const { data: entry, error: entryError } = await serviceClient
        .from("journal_entries")
        .insert([{
          company_id: tpl.company_id,
          description: "Factura recurrente - " + tpl.customer_name + (tpl.description ? " (" + tpl.description + ")" : ""),
          entry_date: today,
          entry_number: nextNumber,
        }])
        .select("id")
        .single();
      if (entryError || !entry) throw new Error("No se pudo crear el asiento: " + entryError?.message);

      const { error: linesError } = await serviceClient.from("journal_lines").insert([
        { journal_entry_id: entry.id, account_id: tpl.ar_account_id, debit: tpl.amount, credit: 0 },
        { journal_entry_id: entry.id, account_id: tpl.revenue_account_id, debit: 0, credit: tpl.amount },
      ]);
      if (linesError) throw new Error("No se pudo guardar el asiento: " + linesError.message);

      const invoiceNumber = "REC-" + tpl.id.slice(0, 8) + "-" + today;
      const { data: invoice, error: invoiceError } = await serviceClient
        .from("ar_invoices")
        .insert([{
          company_id: tpl.company_id,
          customer_name: tpl.customer_name,
          invoice_number: invoiceNumber,
          issue_date: today,
          due_date: today,
          amount: tpl.amount,
          journal_entry_id: entry.id,
        }])
        .select("id")
        .single();
      if (invoiceError || !invoice) throw new Error("No se pudo crear la factura: " + invoiceError?.message);

      const nextRunDate = advanceDate(tpl.next_run_date, tpl.frequency);
      await serviceClient
        .from("recurring_invoice_templates")
        .update({ next_run_date: nextRunDate, last_generated_invoice_id: invoice.id, last_generated_at: new Date().toISOString() })
        .eq("id", tpl.id);

      results.push({ templateId: tpl.id, customerName: tpl.customer_name, invoiceNumber, success: true });
    } catch (err: any) {
      // Una plantilla con error (p.ej. una cuenta contable que se borro)
      // no debe detener la generacion de las demas -- se registra el
      // fallo y se sigue. next_run_date NO se avanza en este caso, asi que
      // la proxima corrida del cron lo vuelve a intentar.
      results.push({ templateId: tpl.id, customerName: tpl.customer_name, success: false, error: err.message });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}