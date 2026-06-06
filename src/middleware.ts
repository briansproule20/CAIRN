import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages + all auth endpoints (login / signup / logout).
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Gate everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpe?g|.*\\.ico|.*\\.webp).*)",
  ],
};
