import { createClient } from "../supabase/server";

export async function casesHandler(event: any) {
  if (event.type !== "rf.case.created") return;

  const supabase = await createClient();

  const { error } = await supabase.from("cases").insert([
    {
      case_code: event.payload.case_code,
      title: event.payload.title,
      description: event.payload.description,
      priority: event.payload.priority,
      status: "OPEN",
      risk_level: event.payload.risk_level,
    },
  ]);

  if (error) {
    console.error("[CASES HANDLER ERROR]", error);
  }
}