import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Pasa a FULLY_DEPRECIATED cualquier activo fijo (fixed_assets) en status
// ACTIVE cuya depreciacion acumulada ya alcanzo (costo - valor residual).
// No es un bug de calculo -- app/accounting/fixed-assets/page.tsx ya
// calcula correctamente la depreciacion acumulada y el valor en libros mes
// a mes (con tope en costo-salvage), y nada depende del campo status para
// ese calculo -- pero sin este cron, un activo totalmente depreciado se
// sigue mostrando como "ACTIVE" para siempre, igual que pasaba con las
// suscripciones vencidas.
//
// La formula replica exactamente calculateDepreciation() de
// app/accounting/fixed-assets/page.tsx: no hay columna de depreciacion
// acumulada en la tabla, se calcula aqui mismo a partir de
// acquisition_date / acquisition_cost / useful_life_years / salvage_value.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === "Bearer " + secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: assets, error } = await serviceClient
    .from("fixed_assets")
    .select("id, company_id, asset_name, acquisition_date, acquisition_cost, useful_life_years, salvage_value")
    .eq("status", "ACTIVE");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const today = new Date();
  const fullyDepreciatedIds: string[] = [];
  const fullyDepreciatedSummary: any[] = [];

  for (const asset of assets ?? []) {
    const cost = asset.acquisition_cost;
    const salvage = asset.salvage_value || 0;
    const years = asset.useful_life_years;
    const acqDate = new Date(asset.acquisition_date);
    const monthsElapsed = Math.max(
      0,
      (today.getFullYear() - acqDate.getFullYear()) * 12 + (today.getMonth() - acqDate.getMonth())
    );
    const monthlyDep = years > 0 ? (cost - salvage) / (years * 12) : 0;
    const accumulated = Math.min(monthlyDep * monthsElapsed, cost - salvage);
    const bookValue = cost - accumulated;

    if (bookValue <= salvage + 0.01) {
      fullyDepreciatedIds.push(asset.id);
      fullyDepreciatedSummary.push({ id: asset.id, company_id: asset.company_id, asset_name: asset.asset_name });
    }
  }

  if (fullyDepreciatedIds.length === 0) {
    return NextResponse.json({ success: true, markedFullyDepreciated: 0, assets: [] });
  }

  const { error: updateError } = await serviceClient
    .from("fixed_assets")
    .update({ status: "FULLY_DEPRECIATED" })
    .in("id", fullyDepreciatedIds);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    markedFullyDepreciated: fullyDepreciatedIds.length,
    assets: fullyDepreciatedSummary,
  });
}
