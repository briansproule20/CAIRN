import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { deleteChat } from "@/lib/repo/chats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stop tracking a CAIRN chat (removes our record; the Poncho chat is untouched). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  await deleteChat(ownerId, decodeURIComponent(id));
  return NextResponse.json({ ok: true });
}
