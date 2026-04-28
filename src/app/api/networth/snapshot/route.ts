import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { getDashboardPayload } from "@/lib/services/dashboard";

/** Record a point-in-time net worth snapshot (e.g. cron monthly). */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dash = await getDashboardPayload(userId, "AUD");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const snap = await prisma.netWorthSnapshot.upsert({
    where: { userId_date: { userId, date: today } },
    create: {
      userId,
      date: today,
      totalAssets: dash.totals.totalAssets,
      totalDebts: dash.totals.totalDebts,
      netWorth: dash.totals.netWorth,
      inflationFactor: 1,
      currency: "AUD",
    },
    update: {
      totalAssets: dash.totals.totalAssets,
      totalDebts: dash.totals.totalDebts,
      netWorth: dash.totals.netWorth,
    },
  });
  return NextResponse.json({ snapshot: snap });
}
