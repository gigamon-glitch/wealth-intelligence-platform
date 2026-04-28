import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getMetalSpots } from "@/lib/services/metals-price";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const spots = await getMetalSpots();
  return NextResponse.json(spots);
}
