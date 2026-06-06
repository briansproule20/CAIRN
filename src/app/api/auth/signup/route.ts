import { NextRequest, NextResponse } from "next/server";
import {
  countUsers,
  getUserByUsername,
  createUser,
} from "@/lib/repo/users";
import { consumeInvite, findUsableInvite } from "@/lib/repo/invites";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request.");
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const ponchoKey = String(body.ponchoKey ?? "").trim();
  const inviteCode = String(body.inviteCode ?? "").trim();

  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    return err("Username: 3–32 chars, letters/numbers/-/_ only.");
  }
  if (password.length < 8) {
    return err("Passphrase must be at least 8 characters.");
  }
  if (!ponchoKey) {
    return err("A Poncho key is required (bring your own).");
  }

  // First account is the owner — no invite needed. After that, invite-only.
  const total = await countUsers();
  let claimed: string | null = null;
  if (total > 0) {
    if (!inviteCode) return err("An invite code is required.", 403);
    const invite = await findUsableInvite(inviteCode);
    if (!invite) return err("That invite code is invalid or already used.", 403);
    claimed = invite.code;
  }

  if (await getUserByUsername(username)) {
    return err("That username is taken.");
  }

  const user = await createUser({ username, password, ponchoKey });
  if (claimed) await consumeInvite(claimed, user.id);

  const token = await signSession(user.id);
  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
