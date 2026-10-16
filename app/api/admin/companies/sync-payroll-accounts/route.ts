import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { buildPayrollAccountPlan, VE_DEFAULT_PAYROLL_CHARGES, type PayrollChargesConfig } from "@/app/lib/jurisdictionTax";

// Retrofit de cuentas de nomina (gasto + por pagar por cada carga
// PATRONAL de la jurisdiccion, ej. IMSS PATRONAL/INFONAVIT en Mexico)
// para una empresa que YA existe -- Tempano y Agroforestal, LLC se
// crearon antes de que app/admin/companies/new/page.tsx generara estas
// cuentas automaticamente, asi que no tienen forma de conseguirlas sin
// esto salvo creando cada cuenta a mano con "+ Nueva" en Nomina. Mismo
// patron service_role/requireOwner que el resto de /api/admin/companies
// -- la empresa puede pertenecer a cualquier contador de la plataforma,
// no solo al propietario.
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

async function requireOwner() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const isOwner =
    userData?.user?.id === PLATFORM_OWNER_ID ||
    userData?.user?.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;
  return isOwner;
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({} as any));
  const companyId = typeof body?.company_id === "string" ? body.company_id : "";
  if (!companyId) {
    return NextResponse.json({ success: false, error: "company_id es obligatorio." }, { status: 400 });
  }

  const db = serviceClient();

  const { data: company, error: companyError } = await db
    .from("companies")
    .select("id, jurisdiction_code")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError || !company) {
    return NextResponse.json({ success: false, error: "Empresa no encontrada." }, { status: 404 });
  }
  const jurisdictionCode = company.jurisdiction_code || "VE";

  const { data: moduleRow } = await db
    .from("jurisdiction_modules")
    .select("config")
    .eq("jurisdiction_code", jurisdictionCode)
    .eq("module_key", "PAYROLL_CHARGES")
    .eq("enabled", true)
    .maybeSingle();
  const config = ((moduleRow?.config as PayrollChargesConfig) ?? VE_DEFAULT_PAYROLL_CHARGES);
  const plan = buildPayrollAccountPlan(config);
  if (plan.length === 0) {
    return NextResponse.json({ success: true, installed: 0, message: "Esta jurisdiccion no tiene cargas patronales configuradas." });
  }

  const { data: existing } = await db.from("chart_of_accounts").select("account_name").eq("company_id", companyId);
  const existingNames = new Set((existing ?? []).map((a: any) => a.account_name));

  const rows: any[] = [];
  plan.forEach((entry, idx) => {
    if (!existingNames.has(entry.expenseName)) {
      rows.push({ company_id: companyId, account_code: "PR-" + (idx * 2 + 1).toString().padStart(3, "0"), account_name: entry.expenseName, account_type: "EXPENSE", monetary_type: "MONETARY" });
    }
    if (!existingNames.has(entry.payableName)) {
      rows.push({ company_id: companyId, account_code: "PR-" + (idx * 2 + 2).toString().padStart(3, "0"), account_name: entry.payableName, account_type: "LIABILITY", monetary_type: "MONETARY" });
    }
  });

  if (rows.length === 0) {
    return NextResponse.json({ success: true, installed: 0, message: "Esta empresa ya tiene todas las cuentas de nomina de su jurisdiccion." });
  }

  const { data: inserted, error: insertError } = await db.from("chart_of_accounts").insert(rows).select("id");
  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, installed: inserted?.length ?? 0 });
}
