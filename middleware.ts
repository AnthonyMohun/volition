import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Check if the user has the auth token
  const authToken = request.cookies.get("auth-token");

  // Allow access to auth routes without authentication
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If trying to access protected routes without token, redirect to home
  if (!authToken) {
    // Allow access to the login page itself
    if (request.nextUrl.pathname === "/") {
      return NextResponse.next();
    }

    // Redirect other routes to home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};
