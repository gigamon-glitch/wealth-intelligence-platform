import type { AuTaxInput, AuTaxResult } from "@/lib/tax/au-resident";

/**
 * Heuristic checklist for legal tax efficiency — educational only; validate with a registered agent.
 */
export function buildTaxOptimizationChecklist(
  input: AuTaxInput,
  result: AuTaxResult
): { priority: "high" | "medium" | "low"; action: string; why: string }[] {
  const items: { priority: "high" | "medium" | "low"; action: string; why: string }[] = [];

  if (input.workDeductions < 500 && input.salaryIncome > 60000) {
    items.push({
      priority: "medium",
      action: "Review work-related deductions (records, home office, tools, professional subs).",
      why: "Reported work deductions are low relative to salary — many taxpayers leave eligible items unclaimed.",
    });
  }

  if (input.rentalIncome > 0 && input.rentalDeductions < input.rentalIncome * 0.2) {
    items.push({
      priority: "medium",
      action: "Validate rental property deductions (interest, depreciation schedule, repairs vs capital).",
      why: "Rental deductions materially affect assessable income and negative gearing outcomes.",
    });
  }

  if (result.netRental < 0 && result.marginalRateApprox >= 0.325) {
    items.push({
      priority: "high",
      action: "Understand how rental losses offset other income at your marginal rate — plan timing of repairs or income.",
      why: `Negative gearing offsets ordinary income; marginal rate ~${(result.marginalRateApprox * 100).toFixed(1)}% in this model.`,
    });
  }

  if (input.capitalGains.some((g) => g.heldDays > 300 && g.heldDays <= 365)) {
    items.push({
      priority: "high",
      action: "For assets near 12 months, consider CGT discount eligibility before realising gains.",
      why: "The 50% CGT discount for individuals requires ownership > 12 months (verify dates).",
    });
  }

  if (result.taxableIncome > 120000 && result.taxableIncome < 180000) {
    items.push({
      priority: "medium",
      action: "Bracket management: large deductions or super contributions (concessional caps) may reduce taxable income.",
      why: "You sit in a mid–upper bracket where marginal rates step materially.",
    });
  }

  items.push({
    priority: "low",
    action: "Prepay deductible expenses or defer income only where permitted and documented.",
    why: "Timing strategies are common but must match facts and ATO guidance.",
  });

  return items;
}
