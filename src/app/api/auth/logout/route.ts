import { NextResponse } from "next/server";

/** Clear the session cookie. The client redirects to /login afterward. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cairn_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
