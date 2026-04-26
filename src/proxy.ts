import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "corecraft.site";

const SUBDOMAIN_TO_PATH: Record<string, string> = {
  shop: "/shop",
  servers: "/servers",
};

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host) return NextResponse.next();

  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
    return NextResponse.next();
  }

  if (!host.endsWith(`.${BASE_DOMAIN}`)) return NextResponse.next();

  const sub = host.slice(0, -1 - BASE_DOMAIN.length);
  const prefix = SUBDOMAIN_TO_PATH[sub];
  if (!prefix) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (url.pathname.startsWith(prefix)) return NextResponse.next();
  url.pathname = `${prefix}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/auth/|favicon.ico|opengraph-image|.*\\..*).*)"],
};
