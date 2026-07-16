import { NextResponse } from "next/server";
import { suggestApuInputs } from "@/app/core/agents/apuSuggestionAgent";

export async function POST(request: Request) {
  try {
    const { description, categoryHint } = await request.json();
    const result = await suggestApuInputs(description, categoryHint);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}