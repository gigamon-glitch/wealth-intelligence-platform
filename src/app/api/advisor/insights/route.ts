import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { buildAdvisorContext } from "@/lib/services/advisor-context";

/** Deterministic + model-ready snapshot for the advisor UI (no OpenAI call). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await buildAdvisorContext(userId);
  return NextResponse.json({
    ruleBasedInsights: ctx.ruleBasedInsights,
    tax: ctx.tax,
    cashflow: ctx.cashflow,
    disclaimer:
      "Insights are algorithmic and educational. They do not replace a registered tax agent or licensed financial adviser.",
  });
}
