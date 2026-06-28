import { supabase } from "../supabase";

export async function riskHandler(event: any) {
  if (event.type !== "rf.risk.calculated") return;

  await supabase.from("rf_risk_scores").insert([
    {
      aml_score: event.payload.aml_score,
      operational_score: event.payload.operational_score,
      tax_score: event.payload.tax_score,
      cyber_score: event.payload.cyber_score,
      total_score: event.payload.total_score,
      generated_by: "EVENT_BUS",
    },
  ]);
}

