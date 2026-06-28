import { supabase } from "./supabase";

export interface AlertData {

  id?: string;

  alert_type: string;

  severity: string;

  title: string;

  description?: string;

  related_case?: string | null;

  related_entity?: string | null;

  related_transaction?: string | null;

  source_engine?: string;

  status?: string;

}

//
// GET ALERTS
//

export async function getAlerts() {

  const { data, error } =
    await supabase
      .from("alerts")
      .select("*")
      .order("created_at", {

        ascending: false,

      });

  if (error) {

    console.error(
      "GET ALERTS ERROR:",
      error.message
    );

    return [];

  }

  return data;

}

//
// CREATE ALERT
//

export async function createAlert(

  alertData: AlertData

) {

  const { data, error } =
    await supabase
      .from("alerts")
      .insert([alertData])
      .select();

  if (error) {

    console.error(
      "CREATE ALERT ERROR:",
      error.message
    );

    throw error;

  }

  return data;

}

//
// RESOLVE ALERT
//

export async function resolveAlert(

  id: string

) {

  const { data, error } =
    await supabase
      .from("alerts")
      .update({

        status: "RESOLVED",

        resolved_at:
          new Date().toISOString(),

      })
      .eq("id", id)
      .select();

  if (error) {

    console.error(
      "RESOLVE ALERT ERROR:",
      error.message
    );

    throw error;

  }

  return data;

}

//
// DELETE ALERT
//

export async function deleteAlert(

  id: string

) {

  const { error } =
    await supabase
      .from("alerts")
      .delete()
      .eq("id", id);

  if (error) {

    console.error(
      "DELETE ALERT ERROR:",
      error.message
    );

    throw error;

  }

  return true;

}

