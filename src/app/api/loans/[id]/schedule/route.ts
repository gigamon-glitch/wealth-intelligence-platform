import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { buildAmortizationSchedule, simulateExtraPrincipal } from "@/lib/finance/amortization";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const loan = await prisma.loan.findFirst({ where: { id: params.id, userId } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const extra = parseFloat(searchParams.get("extraPrincipal") ?? "0");
  const schedule = buildAmortizationSchedule(
    Number(loan.principalRemaining),
    Number(loan.interestRateAnnual),
    loan.termMonths,
    Number(loan.monthlyPayment) + (Number.isFinite(extra) ? extra : 0),
    360
  );
  const sim = simulateExtraPrincipal(
    Number(loan.principalRemaining),
    Number(loan.interestRateAnnual),
    Number(loan.monthlyPayment),
    Number.isFinite(extra) ? extra : 0
  );
  return NextResponse.json({ schedule, earlyPayoffMonths: sim.months, loan });
}
