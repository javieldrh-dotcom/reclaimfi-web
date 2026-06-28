import { supabase } from "@/app/lib/supabase/client";

export async function getUserCompanies(userId: string) {
  const { data, error } = await supabase
    .from("user_companies")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("COMPANIES ERROR:", error);
    return [];
  }

  return data ?? [];
}