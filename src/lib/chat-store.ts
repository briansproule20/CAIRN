import fs from "fs";
import path from "path";

/**
 * Server-side registry of chats CAIRN created (via /api/poncho/stream).
 * This is how we surface "only our chats" — recorded when our API makes the
 * chat, so it works from the browser, curl, anywhere. Local JSON file for now
 * (single-user dev); swap this module for MongoDB when MONGODB_URI is set.
 *
 * Note: serverless filesystems are read-only, so writes no-op there — use the
 * Mongo-backed implementation in production.
 */

export interface RecordedChat {
  id: string;
  title: string;
  mode?: string;
  createdAt: string;
}

const DIR = path.join(process.cwd(), ".cairn");
const FILE = path.join(DIR, "chats.json");

function readAll(): RecordedChat[] {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list: RecordedChat[]): void {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    /* read-only fs (serverless) — use Mongo in production */
  }
}

/** Record a CAIRN-created chat (idempotent on id). */
export function recordChat(chat: {
  id: string;
  title: string;
  mode?: string;
}): void {
  if (!chat.id) return;
  const list = readAll();
  if (list.some((c) => c.id === chat.id)) return;
  const entry: RecordedChat = {
    id: chat.id,
    title: chat.title?.trim() || "Untitled chat",
    mode: chat.mode,
    createdAt: new Date().toISOString(),
  };
  writeAll([entry, ...list].slice(0, 200));
}

/** All CAIRN-created chats, newest first. */
export function listRecordedChats(): RecordedChat[] {
  return readAll();
}
