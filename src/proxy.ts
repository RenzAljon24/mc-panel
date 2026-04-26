import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "corecraft.site";

const SUBDOMAIN_TO_PATH: Record<string, string> = {
  shop: "/shop",
  servers: "/servers",
};

const PASSTHROUGH_PREFIXES = ["/login", "/api", "/_next"];

const AUTH_REQUIRED_SUBDOMAINS = new Set(["servers"]);

function isPassthrough(pathname: string) {
  return PASSTHROUGH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host) return NextResponse.next();

  const isApex = host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`;
  if (isApex) return NextResponse.next();

  if (!host.endsWith(`.${BASE_DOMAIN}`)) return NextResponse.next();

  const sub = host.slice(0, -1 - BASE_DOMAIN.length);
  const prefix = SUBDOMAIN_TO_PATH[sub];
  if (!prefix) return NextResponse.next();

  const url = request.nextUrl.clone();

  if (AUTH_REQUIRED_SUBDOMAINS.has(sub) && !isPassthrough(url.pathname)) {
    const session = getSessionCookie(request);
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", url.pathname || "/");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isPassthrough(url.pathname)) return NextResponse.next();

  if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
    return NextResponse.next();
  }

  url.pathname = `${prefix}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|opengraph-image|.*\\..*).*)"],
};
