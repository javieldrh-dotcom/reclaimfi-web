import { supabase } from "../supabase";

export async function auditHandler(event: any) {
  if (!event.type.startsWith("rf.")) return;

  await supabase.from("rf_audit_logs").insert([
    {
      action_type: event.type,
      target_table: "event_bus",
      action_details: event.payload,
      ip_address: "SYSTEM",
      created_at: new Date().toISOString(),
    },
  ]);
}

