import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { chatSchema } from "@/lib/validation/schemas";
import { runAdvisorChat } from "@/lib/services/ai-advisor";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const out = await runAdvisorChat(userId, parsed.data.message);
  return NextResponse.json(out);
}
