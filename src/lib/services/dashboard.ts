import type { AssetCategory, Currency } from "@prisma/client";
import { subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { convertAmount } from "@/lib/finance/fx";
import { computeFinancialHealthScore } from "@/lib/services/intelligence";

const CPI_ASSUMED = 0.03;

function dec(n: unknown): number {
  return n == null ? 0 : Number(n);
}

export async function getDashboardPayload(userId: string, base: Currency = "AUD") {
  const [assets, loans, expenses, goals, snapshots] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.loan.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.netWorthSnapshot.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 36,
    }),
  ]);

  const toBase = (amt: number, c: Currency) => convertAmount(amt, c, base);

  let totalAssets = 0;
  const allocationMap: Partial<Record<AssetCategory, number>> = {};
  for (const a of assets) {
    const v = toBase(dec(a.value), a.currency);
    totalAssets += v;
    allocationMap[a.category] = (allocationMap[a.category] ?? 0) + v;
  }

  let totalDebts = 0;
  for (const l of loans) {
    totalDebts += toBase(dec(l.principalRemaining), l.currency);
  }

  const netWorth = totalAssets - totalDebts;

  const allocation = Object.entries(allocationMap).map(([k, v]) => ({
    category: k as AssetCategory,
    value: v,
    pct: totalAssets > 0 ? v / totalAssets : 0,
  }));

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyBuckets = new Map<string, number>();
  for (const e of expenses) {
    if (e.date < start) continue;
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    monthlyBuckets.set(key, (monthlyBuckets.get(key) ?? 0) + toBase(dec(e.amount), e.currency));
  }
  const burnSeries = Array.from(monthlyBuckets.entries()).sort(([a], [b]) => a.localeCompare(b));

  const threeAgo = subMonths(new Date(), 3);
  const incomeExp = expenses.filter((e) => e.category === "INCOME" && e.date >= threeAgo);
  const monthlyIncome =
    incomeExp.length > 0
      ? incomeExp.reduce((s, e) => s + toBase(dec(e.amount), e.currency), 0) / 3
      : 0;
  const spend = expenses.filter(
    (e) =>
      e.date >= threeAgo &&
      e.category !== "INCOME" &&
      e.category !== "TRANSFER"
  );
  const monthlyExpenses =
    spend.length > 0
      ? spend.reduce((s, e) => s + toBase(dec(e.amount), e.currency), 0) / 3
      : 0;

  const emergencyFund = assets
    .filter((a) => a.category === "EMERGENCY_FUND" || a.category === "BANK_ACCOUNT")
    .reduce((s, a) => s + toBase(dec(a.value), a.currency), 0);

  const essential =
    expenses
      .filter(
        (e) =>
          e.date >= threeAgo &&
          ["FIXED_RENT", "FIXED_EMI", "FIXED_INSURANCE", "VARIABLE_GROCERIES"].includes(e.category)
      )
      .reduce((s, e) => s + toBase(dec(e.amount), e.currency), 0) / 3;

  const health = computeFinancialHealthScore({
    monthlyIncome: monthlyIncome || monthlyExpenses + 1000,
    monthlyExpenses: monthlyExpenses || 1,
    totalAssets,
    totalDebts,
    emergencyFund,
    monthlyEssentialExpenses: essential || monthlyExpenses * 0.6,
    allocationByCategory: Object.fromEntries(allocation.map((a) => [a.category, a.pct])),
  });

  const inflationAdjusted =
    netWorth > 0 ? netWorth / Math.pow(1 + CPI_ASSUMED, 1) : netWorth;

  const netWorthHistory =
    snapshots.length > 0
      ? snapshots.map((s) => ({
          date: s.date.toISOString().slice(0, 10),
          net: dec(s.netWorth),
          inflationAdjusted: s.inflationFactor ? dec(s.netWorth) / dec(s.inflationFactor) : dec(s.netWorth),
        }))
      : [];

  return {
    baseCurrency: base,
    totals: {
      totalAssets,
      totalDebts,
      netWorth,
      inflationAdjusted,
    },
    allocation,
    burnSeries: burnSeries.map(([month, total]) => ({ month, total })),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      progress: dec(g.targetAmount) > 0 ? dec(g.currentAmount) / dec(g.targetAmount) : 0,
    })),
    health,
    netWorthHistory,
    cpiAssumedAnnual: CPI_ASSUMED,
  };
}

export type DashboardPayload = Awaited<ReturnType<typeof getDashboardPayload>>;
