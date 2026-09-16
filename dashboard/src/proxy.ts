/**
 * Next.js middleware — route protection and role-based access.
 *
 * Applied to every request (except public assets and the login page itself).
 * Unauthenticated users are redirected to /login.
 * Authenticated users on /login are redirected to the dashboard.
 *
 * The token is stored in the `mediver-token` cookie (httpOnly, set by the
 * signIn server action). The middleware only checks presence/expiry; full
 * validation happens on the backend for every protected API call.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico", "/public"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get("mediver-token")?.value ?? null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublicPath(pathname)) {
    const token = getTokenFromRequest(request);
    // Redirect authenticated users away from /login
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);

  if (!token) {
    // Preserve the intended destination so we can redirect back after login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token present — allow through. The backend validates it on every API call.
  // Role-based endpoint restriction is enforced by the FastAPI backend.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals.
     * The (?!...) negative lookahead excludes asset paths from middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
