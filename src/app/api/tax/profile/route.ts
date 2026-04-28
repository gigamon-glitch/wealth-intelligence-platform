import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { taxProfileSchema } from "@/lib/validation/schemas";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profiles = await prisma.taxYearProfile.findMany({
    where: { userId },
    orderBy: { financialYear: "desc" },
  });
  return NextResponse.json({ profiles });
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = taxProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const profile = await prisma.taxYearProfile.upsert({
    where: { userId_financialYear: { userId, financialYear: d.financialYear } },
    create: {
      userId,
      financialYear: d.financialYear,
      salaryIncome: d.salaryIncome,
      rentalIncome: d.rentalIncome,
      rentalDeductions: d.rentalDeductions,
      otherIncome: d.otherIncome,
      workDeductions: d.workDeductions,
      investmentDeductions: d.investmentDeductions,
      capitalGains: d.capitalGains ? (d.capitalGains as object) : undefined,
    },
    update: {
      salaryIncome: d.salaryIncome,
      rentalIncome: d.rentalIncome,
      rentalDeductions: d.rentalDeductions,
      otherIncome: d.otherIncome,
      workDeductions: d.workDeductions,
      investmentDeductions: d.investmentDeductions,
      capitalGains: d.capitalGains ? (d.capitalGains as object) : undefined,
    },
  });
  return NextResponse.json({ profile });
}
