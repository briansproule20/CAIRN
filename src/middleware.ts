import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("cairn_session")?.value;
  const expectedToken = process.env.VAULT_PASSWORD;

  if (!expectedToken) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/api/auth") {
    return NextResponse.next();
  }

  if (session !== expectedToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
