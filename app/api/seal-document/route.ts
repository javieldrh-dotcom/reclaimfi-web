import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string;
    const documentType = formData.get("documentType") as string;

    if (!file || !companyId) {
      return NextResponse.json({ success: false, error: "Falta el archivo o la empresa." }, { status: 400 });
    }

    const { data: membership } = await supabase.from("user_companies").select("id").eq("user_id", userData.user.id).eq("company_id", companyId).maybeSingle();
    if (!membership) {
      return NextResponse.json({ success: false, error: "No tienes acceso a esta empresa." }, { status: 403 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const documentHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const { data: lastSeal } = await supabase
      .from("blockchain_seals")
      .select("chain_hash")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousHash = lastSeal?.chain_hash || "0".repeat(64);
    const chainHash = crypto.createHash("sha256").update(documentHash + previousHash).digest("hex");

    const { data: newSeal, error: insertError } = await supabase.from("blockchain_seals").insert([{
      company_id: companyId,
      document_name: file.name,
      document_type: documentType || "OTRO",
      document_hash: documentHash,
      previous_hash: previousHash,
      chain_hash: chainHash,
      created_by: userData.user.id,
    }]).select("*").single();

    if (insertError || !newSeal) {
      return NextResponse.json({ success: false, error: insertError?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, seal: newSeal });
  } catch (error: any) {
    console.error("SEAL DOCUMENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}