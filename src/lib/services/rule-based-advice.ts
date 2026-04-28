import type { DashboardPayload } from "@/lib/services/dashboard";
import type { AuTaxResult } from "@/lib/tax/au-resident";

export type RuleInsight = {
  id: string;
  severity: "info" | "warn" | "opportunity";
  title: string;
  detail: string;
};

export function buildRuleBasedAdvice(input: {
  dash: DashboardPayload;
  monthlyIncome3m: number;
  monthlySpend3m: number;
  savingsRate: number | null;
  loans: { paymentToIncome: number | null; monthlyPayment: number; name: string }[];
  taxEstimate: AuTaxResult | null;
}): RuleInsight[] {
  const out: RuleInsight[] = [];
  const { dash, savingsRate, monthlyIncome3m, monthlySpend3m } = input;

  if (savingsRate != null) {
    if (savingsRate < 0.1) {
      out.push({
        id: "save-low",
        severity: "warn",
        title: "Savings rate is thin",
        detail:
          "Aim to raise the gap between income and spending — even 5–10% more improves runway and options.",
      });
    } else if (savingsRate >= 0.25) {
      out.push({
        id: "save-strong",
        severity: "opportunity",
        title: "Strong savings discipline",
        detail: "Consider directing surplus to tax-efficient wrappers (e.g. super within caps) and debt reduction.",
      });
    }
  }

  const debtRatio =
    dash.totals.totalAssets > 0 ? dash.totals.totalDebts / dash.totals.totalAssets : 1;
  if (debtRatio > 0.5) {
    out.push({
      id: "debt-high",
      severity: "warn",
      title: "Debt load vs assets",
      detail: `Debt is ~${(debtRatio * 100).toFixed(0)}% of assets — stress-test rate rises and prioritise high-interest debt.`,
    });
  }

  const top = [...dash.allocation].sort((a, b) => b.pct - a.pct)[0];
  if (top && top.pct > 0.45) {
    out.push({
      id: "conc",
      severity: "warn",
      title: `Concentration in ${top.category}`,
      detail: "High single-bucket exposure increases path dependency — consider diversification and rebalancing rules.",
    });
  }

  for (const l of input.loans) {
    if (l.paymentToIncome != null && l.paymentToIncome > 0.35) {
      out.push({
        id: `loan-${l.name}`,
        severity: "warn",
        title: `High repayments: ${l.name}`,
        detail: "A large share of income services debt — build buffer and review refinance/extra payments.",
      });
      break;
    }
  }

  if (input.taxEstimate && monthlyIncome3m > 0) {
    const annualisedTax = input.taxEstimate.totalTax;
    const impliedMonthly = annualisedTax / 12;
    const taxToIncome = impliedMonthly / monthlyIncome3m;
    if (taxToIncome > 0.25) {
      out.push({
        id: "tax-bracket",
        severity: "info",
        title: "Tax take is material",
        detail:
          "Review concessional super (within caps), timing of gains, and deductions documentation — model is illustrative only.",
      });
    }
  }

  if (monthlySpend3m > monthlyIncome3m && monthlyIncome3m > 0) {
    out.push({
      id: "neg-cf",
      severity: "warn",
      title: "Negative cash flow (3-month view)",
      detail: "Spending exceeds income in recent data — verify one-off items and stabilise burn.",
    });
  }

  const fireAnnualSpend = monthlySpend3m * 12;
  const fireNumber = fireAnnualSpend * 25;
  if (fireNumber > 0 && dash.totals.netWorth > 0) {
    out.push({
      id: "fire",
      severity: "info",
      title: "FIRE rule-of-thumb",
      detail: `Rough “25× expenses” target ≈ ${Math.round(fireNumber).toLocaleString()} AUD (using recent spend; adjust for retirement tax/spending).`,
    });
  }

  return out;
}
