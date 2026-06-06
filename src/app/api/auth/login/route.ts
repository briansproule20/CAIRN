import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/repo/users";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and passphrase are required." },
      { status: 400 }
    );
  }

  const user = await verifyLogin(username, password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or passphrase." },
      { status: 401 }
    );
  }

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
