import { supabase } from "../supabase";

export async function casesHandler(event: any) {
  if (event.type !== "rf.case.created") return;

  await supabase.from("rf_cases").insert([
    {
      case_code: event.payload.case_code,
      title: event.payload.title,
      description: event.payload.description,
      priority: event.payload.priority,
      status: "OPEN",
      risk_level: event.payload.risk_level,
    },
  ]);
}

