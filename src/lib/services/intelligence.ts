export type HealthScoreBreakdown = {
  score: number;
  savingsRatePoints: number;
  debtRatioPoints: number;
  diversificationPoints: number;
  emergencyPoints: number;
  notes: string[];
};

/**
 * Composite 0–100 score: transparent weights so users understand the result.
 */
export function computeFinancialHealthScore(input: {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalAssets: number;
  totalDebts: number;
  emergencyFund: number;
  monthlyEssentialExpenses: number;
  allocationByCategory: Record<string, number>;
}): HealthScoreBreakdown {
  const notes: string[] = [];

  const savingsRate =
    input.monthlyIncome > 0
      ? (input.monthlyIncome - input.monthlyExpenses) / input.monthlyIncome
      : 0;
  const savingsRatePoints = Math.max(0, Math.min(25, savingsRate * 100));
  notes.push(`Savings rate ${(savingsRate * 100).toFixed(1)}% → up to 25 pts.`);

  const debtRatio = input.totalAssets > 0 ? input.totalDebts / input.totalAssets : 1;
  const debtRatioPoints = Math.max(0, Math.min(25, 25 - debtRatio * 50));
  notes.push(`Debt/assets ${(debtRatio * 100).toFixed(1)}% → up to 25 pts.`);

  const categories = Object.keys(input.allocationByCategory).length;
  const herfindahl = Object.values(input.allocationByCategory).reduce((s, w) => s + w * w, 0);
  const diversificationPoints = Math.max(0, Math.min(25, categories * 3 + (1 - herfindahl) * 10));
  notes.push(`Diversification (${categories} groups) → up to 25 pts.`);

  const monthsCover =
    input.monthlyEssentialExpenses > 0
      ? input.emergencyFund / input.monthlyEssentialExpenses
      : input.emergencyFund > 0
        ? 12
        : 0;
  const emergencyPoints = Math.max(0, Math.min(25, Math.min(monthsCover / 6, 1) * 25));
  notes.push(`Emergency runway ~${monthsCover.toFixed(1)} mo → up to 25 pts.`);

  const score = Math.round(
    savingsRatePoints + debtRatioPoints + diversificationPoints + emergencyPoints
  );
  return {
    score,
    savingsRatePoints,
    debtRatioPoints,
    diversificationPoints,
    emergencyPoints,
    notes,
  };
}

export function detectExpenseAnomalies(
  series: { month: string; total: number }[],
  thresholdRatio = 1.45
): { month: string; spikePercent: number }[] {
  if (series.length < 3) return [];
  const alerts: { month: string; spikePercent: number }[] = [];
  for (let i = 2; i < series.length; i++) {
    const prev = (series[i - 1].total + series[i - 2].total) / 2;
    if (prev <= 0) continue;
    const ratio = series[i].total / prev;
    if (ratio >= thresholdRatio) {
      alerts.push({ month: series[i].month, spikePercent: (ratio - 1) * 100 });
    }
  }
  return alerts;
}

export function concentrationWarnings(allocation: { label: string; pct: number }[]): string[] {
  return allocation
    .filter((a) => a.pct > 0.45)
    .map((a) => `High concentration in ${a.label}: ${(a.pct * 100).toFixed(0)}% of portfolio.`);
}
