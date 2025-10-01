import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Allow requests if:
  // 1. It's a request for next-auth session & provider fetching
  // 2. The token exists (user is authenticated)
  if (pathname.includes("/api/auth") || token) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without token
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};