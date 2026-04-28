import { subMonths } from "date-fns";
import type { ExpenseCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDashboardPayload } from "@/lib/services/dashboard";
import type { CapitalGainInput } from "@/lib/tax/au-resident";
import { estimateAuResidentTax } from "@/lib/tax/au-resident";
import { buildTaxOptimizationChecklist } from "@/lib/tax/tax-optimization";
import { buildRuleBasedAdvice } from "@/lib/services/rule-based-advice";

function dec(n: unknown): number {
  return n == null ? 0 : Number(n);
}

/**
 * Aggregates everything the model needs for high-quality, grounded advice (no PII beyond what user stored).
 */
export async function buildAdvisorContext(userId: string) {
  const since = subMonths(new Date(), 3);
  const [dash, expenses, assets, loans, goals, taxProfile, memory] = await Promise.all([
    getDashboardPayload(userId, "AUD"),
    prisma.expense.findMany({ where: { userId, date: { gte: since } } }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.loan.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.taxYearProfile.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.financialMemory.findUnique({ where: { userId } }),
  ]);

  const byCategory: Partial<Record<ExpenseCategory, number>> = {};
  let income3m = 0;
  let spend3m = 0;
  for (const e of expenses) {
    const a = dec(e.amount);
    if (e.category === "INCOME") {
      income3m += a;
    } else if (e.category !== "TRANSFER") {
      spend3m += a;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + a;
    }
  }

  const monthlyIncome3m = income3m / 3;
  const monthlySpend3m = spend3m / 3;
  const savingsRate = monthlyIncome3m > 0 ? (monthlyIncome3m - monthlySpend3m) / monthlyIncome3m : null;

  const unrealized = assets
    .filter((x) => x.costBasis != null)
    .map((x) => ({
      name: x.name,
      category: x.category,
      unrealized: dec(x.value) - dec(x.costBasis),
    }));

  const loanStress = loans.map((l) => ({
    name: l.name,
    type: l.type,
    remaining: dec(l.principalRemaining),
    monthlyPayment: dec(l.monthlyPayment),
    ratePct: dec(l.interestRateAnnual),
    paymentToIncome: monthlyIncome3m > 0 ? dec(l.monthlyPayment) / monthlyIncome3m : null,
  }));

  const taxInput = taxProfile
    ? {
        salaryIncome: Number(taxProfile.salaryIncome),
        rentalIncome: Number(taxProfile.rentalIncome),
        rentalDeductions: Number(taxProfile.rentalDeductions),
        otherIncome: Number(taxProfile.otherIncome),
        workDeductions: Number(taxProfile.workDeductions),
        investmentDeductions: Number(taxProfile.investmentDeductions),
        capitalGains: ((taxProfile.capitalGains as CapitalGainInput[]) ?? []).filter(Boolean),
      }
    : null;

  const taxEstimate = taxInput ? estimateAuResidentTax(taxInput) : null;
  const taxChecklist =
    taxInput && taxEstimate ? buildTaxOptimizationChecklist(taxInput, taxEstimate) : [];

  const rules = buildRuleBasedAdvice({
    dash,
    monthlyIncome3m,
    monthlySpend3m,
    savingsRate,
    loans: loanStress,
    taxEstimate,
  });

  return {
    dashboard: dash,
    cashflow: {
      monthlyIncomeAvg: monthlyIncome3m,
      monthlySpendAvg: monthlySpend3m,
      savingsRate,
      spendByCategory: byCategory,
    },
    assets: {
      count: assets.length,
      unrealizedPnL: unrealized.slice(0, 15),
      categories: dash.allocation,
    },
    liabilities: { loans: loanStress },
    goals: goals.map((g) => ({
      name: g.name,
      type: g.type,
      progress:
        dec(g.targetAmount) > 0 ? Math.min(1, dec(g.currentAmount) / dec(g.targetAmount)) : 0,
      targetDate: g.targetDate?.toISOString().slice(0, 10) ?? null,
    })),
    tax: taxProfile
      ? {
          financialYear: taxProfile.financialYear,
          estimate: taxEstimate,
          optimizationChecklist: taxChecklist,
        }
      : null,
    userMemory: memory?.content ?? "",
    ruleBasedInsights: rules,
  };
}
