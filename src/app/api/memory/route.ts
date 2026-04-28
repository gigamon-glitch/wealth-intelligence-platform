import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { z } from "zod";

const memSchema = z.object({ content: z.string().max(12000) });

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const m = await prisma.financialMemory.findUnique({ where: { userId } });
  return NextResponse.json({ memory: m });
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = memSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const memory = await prisma.financialMemory.upsert({
    where: { userId },
    create: { userId, content: parsed.data.content },
    update: { content: parsed.data.content },
  });
  return NextResponse.json({ memory });
}
