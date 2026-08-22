import { NextResponse } from "next/server";
import { reconstructAccountingFromDocument } from "@/app/core/agents/reconstructionAgent";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }
    const { data: allowed } = await supabase.rpc("check_rate_limit", { p_endpoint: "reconstruct-accounting", p_max_requests: 5, p_window_seconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No se recibio ningun archivo." }, { status: 400 });
    }
    if (files.length > 5) {
      return NextResponse.json({ success: false, error: "Maximo 5 documentos a la vez." }, { status: 400 });
    }

    const maxSizeBytes = 25 * 1024 * 1024;
    const results = [];

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        results.push({ documentName: file.name, transactions: [], warnings: ["Archivo muy grande, omitido (maximo 25MB)."], documentSummary: "" });
        continue;
      }

      let fileText = "";
      try {
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith(".pdf")) {
          const { PDFParse } = await import("pdf-parse");
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const parser = new PDFParse({ data: buffer });
          const textResult = await parser.getText();
          fileText = textResult.text;
          await parser.destroy();
        } else if (lowerName.endsWith(".docx")) {
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const result = await mammoth.extractRawText({ buffer });
          fileText = result.value;
        } else {
          fileText = await file.text();
        }
      } catch (extractError) {
        console.error("TEXT EXTRACTION ERROR:", extractError);
        results.push({ documentName: file.name, transactions: [], warnings: ["No se pudo extraer el texto de este archivo."], documentSummary: "" });
        continue;
      }

      if (!fileText.trim()) {
        results.push({ documentName: file.name, transactions: [], warnings: ["El documento parece estar vacio o no se pudo leer texto."], documentSummary: "" });
        continue;
      }

      const reconstruction = await reconstructAccountingFromDocument(fileText, file.name);
      results.push({ documentName: file.name, ...reconstruction });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("RECONSTRUCT ACCOUNTING ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}