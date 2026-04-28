import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { assetCreateSchema } from "@/lib/validation/schemas";
import { encryptText } from "@/lib/crypto";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.asset.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ assets: rows });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = assetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const notesEnc = d.notes ? encryptText(d.notes) : null;
  const asset = await prisma.asset.create({
    data: {
      userId,
      category: d.category,
      name: d.name,
      currency: d.currency,
      value: d.value,
      costBasis: d.costBasis ?? undefined,
      purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : undefined,
      details: (d.details ?? undefined) as Prisma.InputJsonValue | undefined,
      source: d.source ?? "MANUAL",
      notesEnc: notesEnc ?? undefined,
    },
  });
  return NextResponse.json({ asset });
}
