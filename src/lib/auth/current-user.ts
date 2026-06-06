import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";
import { getUserById } from "@/lib/repo/users";

/** The logged-in user (or null) — for server components and route handlers. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  return getUserById(session.userId);
}

/** The logged-in user's id, or null. Cheap — no DB hit. */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  return session?.userId ?? null;
}
