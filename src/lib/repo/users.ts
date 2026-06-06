import { eq, sql, asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  hashPassword,
  verifyPassword,
  encryptSecret,
  decryptSecret,
} from "@/lib/auth/crypto";

export async function countUsers(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users);
  return row?.n ?? 0;
}

/** The owner is the first account created. */
export async function getOwnerId(): Promise<string | null> {
  const db = getDb();
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.createdAt))
    .limit(1);
  return u?.id ?? null;
}

export async function isOwner(userId: string): Promise<boolean> {
  const ownerId = await getOwnerId();
  return ownerId !== null && ownerId === userId;
}

export async function getUserByUsername(username: string) {
  const db = getDb();
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  return u ?? null;
}

export async function getUserById(id: string) {
  const db = getDb();
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}

export async function createUser(input: {
  username: string;
  password: string;
  ponchoKey: string;
  displayName?: string;
}) {
  const db = getDb();
  const [u] = await db
    .insert(users)
    .values({
      username: input.username.toLowerCase(),
      displayName: input.displayName ?? null,
      passwordHash: hashPassword(input.password),
      ponchoKeyEnc: encryptSecret(input.ponchoKey),
    })
    .returning();
  return u;
}

export async function verifyLogin(username: string, password: string) {
  const u = await getUserByUsername(username);
  if (!u) return null;
  if (!verifyPassword(password, u.passwordHash)) return null;
  return u;
}

/** Decrypt a user's BYO Poncho key (for server-side Poncho calls). */
export function userPonchoKey(u: {
  ponchoKeyEnc: string | null;
}): string | null {
  if (!u.ponchoKeyEnc) return null;
  try {
    return decryptSecret(u.ponchoKeyEnc);
  } catch {
    return null;
  }
}

export async function setPonchoKey(userId: string, ponchoKey: string) {
  const db = getDb();
  await db
    .update(users)
    .set({ ponchoKeyEnc: encryptSecret(ponchoKey) })
    .where(eq(users.id, userId));
}
