import { NextResponse } from "next/server";
import { reconcileBankStatement } from "@/app/core/agents/bankReconciliationAgent";

export async function POST(request: Request) {
  try {
    const { bookMovements, bankLines } = await request.json();
    const result = await reconcileBankStatement(bookMovements, bankLines);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}