import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("sb-access-token");

  const isAuth = !!session;
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  if (!isAuth && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/clientes/:path*", "/clientes"],
};