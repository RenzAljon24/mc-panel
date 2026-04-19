import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Next.js 16: Middleware is now called Proxy. File must be `proxy.ts` at project root.
// Optimistic check only — real session validation happens inside route handlers / server actions.
export function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/servers/:path*", "/dashboard/:path*"],
};
