    import { supabase } from "../supabase";

export async function alertsHandler(event: any) {
  if (event.type !== "rf.alert.created") return;

  await supabase.from("rf_alerts").insert([
    {
      alert_type: event.payload.alert_type,
      severity: event.payload.severity,
      title: event.payload.title,
      description: event.payload.description,
      status: "OPEN",
      created_at: new Date().toISOString(),
    },
  ]);
}

