import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { assetCreateSchema } from "@/lib/validation/schemas";
import { encryptText } from "@/lib/crypto";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.asset.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const parsed = assetCreateSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const notesEnc =
    d.notes !== undefined ? (d.notes ? encryptText(d.notes) : null) : undefined;

  const asset = await prisma.asset.update({
    where: { id: params.id },
    data: {
      ...(d.category !== undefined && { category: d.category }),
      ...(d.name !== undefined && { name: d.name }),
      ...(d.currency !== undefined && { currency: d.currency }),
      ...(d.value !== undefined && { value: d.value }),
      ...(d.costBasis !== undefined && { costBasis: d.costBasis }),
      ...(d.purchaseDate !== undefined && {
        purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : null,
      }),
      ...(d.details !== undefined && {
        details: (d.details ?? undefined) as Prisma.InputJsonValue,
      }),
      ...(d.source !== undefined && { source: d.source }),
      ...(notesEnc !== undefined && { notesEnc }),
    },
  });
  return NextResponse.json({ asset });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.asset.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
