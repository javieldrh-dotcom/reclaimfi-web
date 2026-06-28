import { supabase } from "./supabase";

export interface CaseData {

  id?: string;

  case_code: string;

  title: string;

  description?: string;

  case_type?: string;

  priority?: string;

  status?: string;

  risk_level?: string;

  assigned_to?: string | null;

  created_by?: string | null;

}

//
// GET ALL CASES
//

export async function getCases() {

  const { data, error } =
    await supabase
      .from("cases")
      .select("*")
      .order("created_at", {

        ascending: false,

      });

  if (error) {

    console.error(
      "GET CASES ERROR:",
      error.message
    );

    return [];

  }

  return data;

}

//
// CREATE CASE
//

export async function createCase(

  caseData: CaseData

) {

  const { data, error } =
    await supabase
      .from("cases")
      .insert([caseData])
      .select();

  if (error) {

    console.error(
      "CREATE CASE ERROR:",
      error.message
    );

    throw error;

  }

  return data;

}

//
// UPDATE CASE
//

export async function updateCase(

  id: string,

  updates: Partial<CaseData>

) {

  const { data, error } =
    await supabase
      .from("cases")
      .update(updates)
      .eq("id", id)
      .select();

  if (error) {

    console.error(
      "UPDATE CASE ERROR:",
      error.message
    );

    throw error;

  }

  return data;

}

//
// DELETE CASE
//

export async function deleteCase(

  id: string

) {

  const { error } =
    await supabase
      .from("cases")
      .delete()
      .eq("id", id);

  if (error) {

    console.error(
      "DELETE CASE ERROR:",
      error.message
    );

    throw error;

  }

  return true;

}

