import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const message = (body.message || "").toString().trim();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Todos los campos son obligatorios." }, { status: 400 });
    }
    if (name.length > 200 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ success: false, error: "Uno de los campos excede el largo permitido." }, { status: 400 });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ success: false, error: "Correo electronico invalido." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contact_submissions").insert({ name, email, message });

    if (error) {
      return NextResponse.json({ success: false, error: "No se pudo guardar el mensaje." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Solicitud invalida." }, { status: 400 });
  }
}