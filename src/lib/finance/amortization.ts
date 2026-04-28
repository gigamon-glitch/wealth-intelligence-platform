/**
 * Standard amortization: monthly payment assumed fixed; interest accrues on remaining balance.
 * Returns schedule for UI and simulations (early payoff = pay extra principal each month).
 */

export type AmortizationRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export function monthlyRate(annualPercent: number): number {
  return annualPercent / 100 / 12;
}

export function buildAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
  monthlyPayment: number,
  maxRows = 600
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = principal;
  const mr = monthlyRate(annualRatePercent);
  for (let m = 1; m <= termMonths && m <= maxRows && balance > 0.01; m++) {
    const interest = balance * mr;
    const principalPart = Math.min(monthlyPayment - interest, balance);
    if (principalPart < 0) break;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      month: m,
      payment: monthlyPayment,
      principal: principalPart,
      interest,
      balance,
    });
  }
  return rows;
}

/** Extra monthly payment reduces term — returns new approximate payoff month count. */
export function simulateExtraPrincipal(
  principal: number,
  annualRatePercent: number,
  monthlyPayment: number,
  extraPrincipal: number
): { months: number; totalInterest: number } {
  let balance = principal;
  const mr = monthlyRate(annualRatePercent);
  let months = 0;
  let totalInterest = 0;
  while (balance > 0.01 && months < 1200) {
    months++;
    const interest = balance * mr;
    totalInterest += interest;
    const principalPart = monthlyPayment + extraPrincipal - interest;
    if (principalPart <= 0) return { months: Infinity, totalInterest: Infinity };
    balance -= principalPart;
  }
  return { months, totalInterest };
}
