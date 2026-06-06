import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { chats } from "@/lib/db/schema";

/**
 * Per-owner registry of CAIRN-created Poncho chats (DB-backed, replaces the
 * local file so it persists on serverless and partitions by user).
 */

export async function recordChat(
  ownerId: string,
  chat: { ponchoChatId: string; title: string; mode?: string }
): Promise<void> {
  if (!ownerId || !chat.ponchoChatId) return;
  const db = getDb();
  await db
    .insert(chats)
    .values({
      ownerId,
      ponchoChatId: chat.ponchoChatId,
      title: chat.title?.trim() || "Untitled chat",
      mode: chat.mode,
    })
    .onConflictDoNothing();
}

export interface ChatListItem {
  id: string; // the Poncho chat id (used by /chats/[id])
  title: string;
  mode: string | null;
}

export async function listChatsFor(ownerId: string): Promise<ChatListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: chats.ponchoChatId,
      title: chats.title,
      mode: chats.mode,
    })
    .from(chats)
    .where(eq(chats.ownerId, ownerId))
    .orderBy(desc(chats.createdAt))
    .limit(50);
  return rows;
}
