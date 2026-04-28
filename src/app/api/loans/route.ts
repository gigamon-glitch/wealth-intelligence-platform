import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { loanCreateSchema } from "@/lib/validation/schemas";
import { buildAmortizationSchedule } from "@/lib/finance/amortization";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const loans = await prisma.loan.findMany({ where: { userId }, orderBy: { startDate: "desc" } });
  return NextResponse.json({ loans });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = loanCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const loan = await prisma.loan.create({
    data: {
      userId,
      name: d.name,
      type: d.type,
      currency: d.currency,
      principalOriginal: d.principalOriginal,
      principalRemaining: d.principalRemaining,
      interestRateAnnual: d.interestRateAnnual,
      monthlyPayment: d.monthlyPayment,
      startDate: new Date(d.startDate),
      termMonths: d.termMonths,
      details: (d.details ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  const schedule = buildAmortizationSchedule(
    Number(loan.principalRemaining),
    Number(loan.interestRateAnnual),
    loan.termMonths,
    Number(loan.monthlyPayment),
    12
  );
  return NextResponse.json({ loan, schedulePreview: schedule });
}
