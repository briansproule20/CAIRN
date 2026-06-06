import { NextResponse } from "next/server";
import { listRecordedChats } from "@/lib/chat-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only the chats CAIRN created (from the server-side registry). */
export async function GET() {
  return NextResponse.json(
    { chats: listRecordedChats() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
