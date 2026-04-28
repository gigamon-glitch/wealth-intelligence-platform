import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { estimateAuResidentTax } from "@/lib/tax/au-resident";
import { buildTaxOptimizationChecklist } from "@/lib/tax/tax-optimization";
import { taxProfileSchema } from "@/lib/validation/schemas";

/** POST: run estimate from body OR from saved profile for financialYear query param. */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fy = searchParams.get("financialYear");

  let input;
  if (fy) {
    const p = await prisma.taxYearProfile.findUnique({
      where: { userId_financialYear: { userId, financialYear: fy } },
    });
    if (!p) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    const cg = (p.capitalGains as { proceeds: number; costBase: number; heldDays: number }[]) ?? [];
    input = {
      salaryIncome: Number(p.salaryIncome),
      rentalIncome: Number(p.rentalIncome),
      rentalDeductions: Number(p.rentalDeductions),
      otherIncome: Number(p.otherIncome),
      workDeductions: Number(p.workDeductions),
      investmentDeductions: Number(p.investmentDeductions),
      capitalGains: cg,
    };
  } else {
    const body = await req.json();
    const parsed = taxProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    input = {
      salaryIncome: d.salaryIncome,
      rentalIncome: d.rentalIncome,
      rentalDeductions: d.rentalDeductions,
      otherIncome: d.otherIncome,
      workDeductions: d.workDeductions,
      investmentDeductions: d.investmentDeductions,
      capitalGains: d.capitalGains ?? [],
    };
  }

  const result = estimateAuResidentTax(input);
  const optimizationChecklist = buildTaxOptimizationChecklist(input, result);

  const harvesting =
    input.capitalGains.length > 0
      ? [
          "Offset capital gains with realized losses where permitted; track holding periods for the 12-month CGT discount.",
          "Consider timing of asset sales across financial years to manage marginal tax brackets.",
        ]
      : [];

  return NextResponse.json({
    result,
    optimizationChecklist,
    taxLossHarvestingIdeas: harvesting,
    disclaimer:
      "Educational model only — not personal tax advice and not a substitute for a registered tax agent where required by law.",
  });
}
