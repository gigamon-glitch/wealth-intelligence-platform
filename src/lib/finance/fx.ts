import type { Currency } from "@prisma/client";

/** Static fallback FX for demo; replace with FxRate table + daily job in production. */
const FALLBACK: Record<string, number> = {
  AUD_USD: 0.65,
  AUD_INR: 54,
  USD_AUD: 1 / 0.65,
  INR_AUD: 1 / 54,
  USD_INR: 83,
  INR_USD: 1 / 83,
};

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Record<string, number> = FALLBACK
): number {
  if (from === to) return amount;
  const key = `${from}_${to}` as keyof typeof FALLBACK;
  const rate = rates[key] ?? 1 / (rates[`${to}_${from}` as keyof typeof FALLBACK] || 1);
  return amount * rate;
}
