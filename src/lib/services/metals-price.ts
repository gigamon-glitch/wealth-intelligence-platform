import { prisma } from "@/lib/db";

/** Approximate spot AUD per troy ounce when APIs unavailable — clearly labeled as fallback in UI. */
const FALLBACK_XAU_AUD = 3850;
const FALLBACK_XAG_AUD = 46;

export type MetalSpot = { symbol: string; audPerOz: number; source: string; fetchedAt: string };

async function cacheGet(key: string): Promise<number | null> {
  const row = await prisma.priceCache.findUnique({ where: { key } });
  if (!row) return null;
  const age = Date.now() - row.fetchedAt.getTime();
  if (age > 6 * 60 * 60 * 1000) return null; // 6h TTL
  return Number(row.value);
}

async function cacheSet(key: string, value: number) {
  await prisma.priceCache.upsert({
    where: { key },
    create: { key, value, fetchedAt: new Date() },
    update: { value, fetchedAt: new Date() },
  });
}

/**
 * Fetches gold/silver spot in AUD. Uses METALS_API_URL + METALS_API_KEY if configured;
 * otherwise fallback constants (still cached for consistency).
 */
export async function getMetalSpots(): Promise<{ gold: MetalSpot; silver: MetalSpot }> {
  const url = process.env.METALS_API_URL;
  const key = process.env.METALS_API_KEY;

  let gold = await cacheGet("XAU_AUD");
  let silver = await cacheGet("XAG_AUD");
  let source = "cache_or_fallback";

  if (url && key) {
    try {
      const res = await fetch(`${url}?api_key=${encodeURIComponent(key)}&base=AUD&currencies=XAU,XAG`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const j = (await res.json()) as { rates?: Record<string, number> };
        if (j.rates?.XAU) {
          gold = 1 / j.rates.XAU;
          await cacheSet("XAU_AUD", gold);
        }
        if (j.rates?.XAG) {
          silver = 1 / j.rates.XAG;
          await cacheSet("XAG_AUD", silver);
        }
        source = "metals_api";
      }
    } catch {
      /* use cache/fallback */
    }
  }

  if (gold == null) {
    gold = FALLBACK_XAU_AUD;
    await cacheSet("XAU_AUD", gold);
  }
  if (silver == null) {
    silver = FALLBACK_XAG_AUD;
    await cacheSet("XAG_AUD", silver);
  }

  const now = new Date().toISOString();
  return {
    gold: { symbol: "XAU", audPerOz: gold, source, fetchedAt: now },
    silver: { symbol: "XAG", audPerOz: silver, source, fetchedAt: now },
  };
}

/** Value of a gold/silver holding from weight (grams) and purity (karats, 24 = pure). */
export function metalValueAud(weightGrams: number, purityKarats: number, spotAudPerOz: number): number {
  const pureFraction = purityKarats / 24;
  const oz = weightGrams / 31.1034768;
  return oz * spotAudPerOz * pureFraction;
}
