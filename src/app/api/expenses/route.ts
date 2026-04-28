import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { expenseCreateSchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const rows = await prisma.expense.findMany({
    where: {
      userId,
      ...((from || to) && {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      }),
    },
    orderBy: { date: "desc" },
    take: 500,
  });
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: d.amount,
      currency: d.currency,
      category: d.category,
      description: d.description,
      date: new Date(d.date),
      isRecurring: d.isRecurring ?? false,
      recurrence: d.recurrence ?? undefined,
      merchant: d.merchant ?? undefined,
    },
  });
  return NextResponse.json({ expense });
}
