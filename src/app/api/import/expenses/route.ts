import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { ExpenseCategory, Currency } from "@prisma/client";

/**
 * CSV columns: date (ISO), amount, category (enum key), description?, currency?
 * Bank API–ready: same endpoint can later accept OFX/JSON from a provider.
 */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const text = await req.text();
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "Expected header + rows" }, { status: 400 });
  }
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    try {
      const dateStr = cols[idx("date")] ?? cols[0];
      const amount = parseFloat(cols[idx("amount")] ?? cols[1]);
      const catRaw = (cols[idx("category")] ?? cols[2] ?? "VARIABLE_OTHER") as keyof typeof ExpenseCategory;
      const category = ExpenseCategory[catRaw] ?? ExpenseCategory.VARIABLE_OTHER;
      const description = cols[idx("description")] ?? cols[3] ?? null;
      const cur = (cols[idx("currency")] ?? "AUD") as Currency;
      if (!dateStr || Number.isNaN(amount)) throw new Error("bad row");
      await prisma.expense.create({
        data: {
          userId,
          date: new Date(dateStr),
          amount,
          category,
          description,
          currency: Currency[cur] ?? Currency.AUD,
        },
      });
      imported++;
    } catch (e) {
      errors.push(`Line ${i + 1}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
