import { NextResponse } from "next/server";
import { listChatsFor } from "@/lib/repo/chats";
import { getCurrentUserId } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in owner's CAIRN-created chats. */
export async function GET() {
  const ownerId = await getCurrentUserId();
  const chats = ownerId ? await listChatsFor(ownerId) : [];
  return NextResponse.json({ chats }, { headers: { "Cache-Control": "no-store" } });
}
