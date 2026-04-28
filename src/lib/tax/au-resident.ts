/**
 * Australian resident tax estimation (educational — not tax advice).
 * Components: marginal scales (2024–25 style), LITO (simplified two-tier), Medicare levy 2% with
 * low-income shading for singles (ATO-style phase-in band — approximate).
 * CGT: 50% discount if held > 12 months (model uses heldDays > 365 as proxy).
 */

export type CapitalGainInput = {
  proceeds: number;
  costBase: number;
  heldDays: number;
};

export type AuTaxInput = {
  salaryIncome: number;
  rentalIncome: number;
  rentalDeductions: number;
  otherIncome: number;
  workDeductions: number;
  investmentDeductions: number;
  capitalGains: CapitalGainInput[];
};

export type AuTaxResult = {
  taxableOrdinaryIncome: number;
  netRental: number;
  capitalGainNet: number;
  taxableIncome: number;
  /** Gross tax before non-refundable offsets (LITO). */
  grossIncomeTax: number;
  /** Low Income Tax Offset applied (capped by gross tax). */
  litoApplied: number;
  /** Income tax after LITO (before Medicare). */
  incomeTax: number;
  medicareLevy: number;
  totalTax: number;
  effectiveRate: number;
  /** Approximate marginal rate on the next $1 of ordinary income (for planning). */
  marginalRateApprox: number;
  explanations: string[];
};

/** 2024–25 resident marginal tax on taxable income (before offsets). */
function incomeTax2024_25(taxable: number): number {
  if (taxable <= 18200) return 0;
  if (taxable <= 45000) return (taxable - 18200) * 0.19;
  if (taxable <= 120000) return 5092 + (taxable - 45000) * 0.325;
  if (taxable <= 180000) return 29467 + (taxable - 120000) * 0.37;
  return 51667 + (taxable - 180000) * 0.45;
}

/**
 * LITO — simplified: full $700 at or below $37,500; linear phase-out to $45,000; zero above.
 * ATO also has a secondary taper to $66,667 — omitted here; document in explanations.
 */
function lowIncomeTaxOffset(taxableIncome: number): number {
  if (taxableIncome <= 37500) return 700;
  if (taxableIncome <= 45000) return Math.max(0, 700 - (taxableIncome - 37500) * (700 / 7500));
  return 0;
}

/**
 * Medicare levy 2% with single low-income reduction — approximate ATO shading band.
 * Thresholds rounded; verify against current ATO tables yearly.
 */
function medicareLevySingle(taxableIncome: number): number {
  const lower = 26000;
  const upper = 32500;
  if (taxableIncome <= lower) return 0;
  if (taxableIncome >= upper) return taxableIncome * 0.02;
  const fraction = (taxableIncome - lower) / (upper - lower);
  return taxableIncome * 0.02 * fraction;
}

function marginalRateApprox(ti: number): number {
  if (ti <= 18200) return 0;
  if (ti <= 45000) return 0.19;
  if (ti <= 120000) return 0.325;
  if (ti <= 180000) return 0.37;
  return 0.45;
}

function assessableCapitalGain(g: CapitalGainInput): { net: number; note: string } {
  const raw = Math.max(0, g.proceeds - g.costBase);
  if (g.heldDays > 365) {
    const discounted = raw * 0.5;
    return {
      net: discounted,
      note: `CGT discount applied (held ${g.heldDays}d): taxable gain ${discounted.toFixed(0)} of ${raw.toFixed(0)}.`,
    };
  }
  return { net: raw, note: `No/full CGT discount (held ${g.heldDays}d): taxable gain ${raw.toFixed(0)}.` };
}

export function estimateAuResidentTax(input: AuTaxInput): AuTaxResult {
  const explanations: string[] = [];

  const netRental = input.rentalIncome - input.rentalDeductions;
  explanations.push(
    netRental >= 0
      ? `Net rental: ${netRental.toFixed(0)} (income ${input.rentalIncome} − deductions ${input.rentalDeductions}).`
      : `Negative gearing: rental loss ${netRental.toFixed(0)} offsets other income.`
  );

  let capitalGainNet = 0;
  for (const g of input.capitalGains) {
    const { net, note } = assessableCapitalGain(g);
    capitalGainNet += net;
    explanations.push(note);
  }

  const ordinary =
    input.salaryIncome +
    input.otherIncome +
    netRental -
    input.workDeductions -
    input.investmentDeductions;

  const taxableOrdinaryIncome = Math.max(0, ordinary);
  const taxableIncome = taxableOrdinaryIncome + capitalGainNet;

  const grossIncomeTax = incomeTax2024_25(taxableIncome);
  const litoRaw = lowIncomeTaxOffset(taxableIncome);
  const litoApplied = Math.min(grossIncomeTax, litoRaw);
  const incomeTax = Math.max(0, grossIncomeTax - litoRaw);
  explanations.push(
    `Gross income tax (scales): ${grossIncomeTax.toFixed(0)}; LITO (simplified model): −${litoApplied.toFixed(0)} (raw offset ${litoRaw.toFixed(0)}).`
  );
  explanations.push(
    `LITO model omits secondary taper ($45,001–$66,667) — refine with ATO worksheets for edge cases.`
  );

  const ml = medicareLevySingle(taxableIncome);
  explanations.push(`Medicare levy (2% with low-income shading, single): ${ml.toFixed(0)}.`);

  const totalTax = incomeTax + ml;
  const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome : 0;

  explanations.push(
    `Taxable ordinary (after deductions): ${taxableOrdinaryIncome.toFixed(0)}; assessable CGT component: ${capitalGainNet.toFixed(0)}.`
  );

  return {
    taxableOrdinaryIncome,
    netRental,
    capitalGainNet,
    taxableIncome,
    grossIncomeTax,
    litoApplied,
    incomeTax,
    medicareLevy: ml,
    totalTax,
    effectiveRate,
    marginalRateApprox: marginalRateApprox(taxableIncome),
    explanations,
  };
}
