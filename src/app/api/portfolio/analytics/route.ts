import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";

/** Sector/benchmark-style analytics — uses asset details.ticker when present; benchmarks are illustrative. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assets = await prisma.asset.findMany({ where: { userId } });

  let stockValue = 0;
  const sectors: Record<string, number> = {};
  for (const a of assets) {
    const v = Number(a.value);
    const d = (a.details as { ticker?: string; sector?: string } | null) ?? {};
    if (["STOCK", "ETF", "MUTUAL_FUND"].includes(a.category)) {
      stockValue += v;
      const sec = d.sector ?? "Unknown";
      sectors[sec] = (sectors[sec] ?? 0) + v;
    }
  }

  const sectorPct = Object.entries(sectors).map(([sector, val]) => ({
    sector,
    value: val,
    pct: stockValue > 0 ? val / stockValue : 0,
  }));

  const weights = Object.values(sectors).map((x) => x / (stockValue || 1));
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  const diversificationScore = Math.min(100, Object.keys(sectors).length * 15 + (1 - hhi) * 40);

  return NextResponse.json({
    benchmarks: {
      ASX200: { ytdReturn: 0.04, note: "Illustrative placeholder — connect index feed for live data." },
      SP500: { ytdReturn: 0.08, note: "Illustrative placeholder." },
    },
    sectorAllocation: sectorPct,
    diversificationScore: Math.round(diversificationScore),
    rebalancingSuggestions:
      sectorPct.filter((s) => s.pct > 0.4).length > 0
        ? [
            "One sector exceeds 40% of listed equities — consider trimming into underweight sleeves.",
            "Review super vs taxable wrappers for tax-efficient rebalancing.",
          ]
        : ["Allocation looks reasonably spread across captured sectors."],
  });
}
