import { randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { invites } from "@/lib/db/schema";

/** Generate a fresh single-use invite code. */
export async function createInvite(createdBy: string) {
  const db = getDb();
  const code = randomBytes(9).toString("base64url"); // ~12 chars, url-safe
  const [inv] = await db
    .insert(invites)
    .values({ code, createdBy })
    .returning();
  return inv;
}

/** An unused invite matching this code, or null. */
export async function findUsableInvite(code: string) {
  const db = getDb();
  const [inv] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.code, code), isNull(invites.usedBy)))
    .limit(1);
  return inv ?? null;
}

/** Atomically claim an invite for a user; returns the row if it was unused. */
export async function consumeInvite(code: string, userId: string) {
  const db = getDb();
  const [inv] = await db
    .update(invites)
    .set({ usedBy: userId, usedAt: new Date() })
    .where(and(eq(invites.code, code), isNull(invites.usedBy)))
    .returning();
  return inv ?? null;
}

/** Invites created by a user (newest first) — for the Settings panel. */
export async function listInvitesBy(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(invites)
    .where(eq(invites.createdBy, userId))
    .orderBy(desc(invites.createdAt));
}

/** Every invite (admin view). */
export async function listAllInvites() {
  const db = getDb();
  return db.select().from(invites).orderBy(desc(invites.createdAt));
}
