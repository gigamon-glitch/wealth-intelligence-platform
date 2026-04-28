import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDashboardPayload } from "@/lib/services/dashboard";
import { prisma } from "@/lib/db";
import { detectExpenseAnomalies, concentrationWarnings } from "@/lib/services/intelligence";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dash = await getDashboardPayload(userId, "AUD");

  const anomalies = detectExpenseAnomalies(dash.burnSeries.map((b) => ({ month: b.month, total: b.total })));
  const concentration = concentrationWarnings(
    dash.allocation.map((a) => ({ label: a.category, pct: a.pct }))
  );

  const loans = await prisma.loan.findMany({ where: { userId } });
  const emiStress = loans.some((l) => {
    const ratio = Number(l.monthlyPayment) / Math.max(1, dash.totals.totalAssets * 0.004);
    return ratio > 3;
  });

  const alerts: { type: string; message: string; severity: string }[] = [];
  for (const a of anomalies) {
    alerts.push({
      type: "ANOMALY",
      message: `Spending spike in ${a.month}: +${a.spikePercent.toFixed(0)}% vs prior avg.`,
      severity: "WARN",
    });
  }
  for (const c of concentration) {
    alerts.push({ type: "CONCENTRATION", message: c, severity: "INFO" });
  }
  if (emiStress) {
    alerts.push({
      type: "EMI_STRESS",
      message: "Debt payments look elevated relative to asset base — review cash buffer.",
      severity: "WARN",
    });
  }

  return NextResponse.json({ ...dash, alerts });
}
