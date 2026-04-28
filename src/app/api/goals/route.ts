import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { goalCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = goalCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      userId,
      name: d.name,
      type: d.type,
      currency: d.currency,
      targetAmount: d.targetAmount,
      currentAmount: d.currentAmount ?? 0,
      targetDate: d.targetDate ? new Date(d.targetDate) : undefined,
    },
  });
  return NextResponse.json({ goal });
}
