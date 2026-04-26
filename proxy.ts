import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "corecraft.site";

const SUBDOMAIN_TO_PATH: Record<string, string> = {
  shop: "/shop",
  servers: "/servers",
  map: "/map",
};

const PUBLIC_PATHS = ["/login", "/api", "/_next"];

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host")?.split(":")[0];

  if (!host) return NextResponse.next();

  // =========================
  // 1. AUTH CHECK (GLOBAL)
  // =========================
  const session = getSessionCookie(request);

  const isPublic = PUBLIC_PATHS.some((p) =>
    url.pathname.startsWith(p)
  );

  if (!session && !isPublic) {
    url.pathname = "/login";

    // prevent infinite loop
    if (url.searchParams.get("next") === "/login") {
      url.searchParams.delete("next");
    } else {
      url.searchParams.set("next", url.pathname);
    }

    return NextResponse.redirect(url);
  }

  // =========================
  // 2. ROOT DOMAIN PASS
  // =========================
  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
    return NextResponse.next();
  }

  // must be subdomain
  if (!host.endsWith(`.${BASE_DOMAIN}`)) {
    return NextResponse.next();
  }

  // =========================
  // 3. SUBDOMAIN REWRITE
  // =========================
  const subdomain = host.replace(`.${BASE_DOMAIN}`, "");
  const prefix = SUBDOMAIN_TO_PATH[subdomain];

  if (!prefix) return NextResponse.next();

  // don't rewrite API or auth routes
  if (isPublic) return NextResponse.next();

  // prevent double rewrite
  if (url.pathname.startsWith(prefix)) {
    return NextResponse.next();
  }

  url.pathname = `${prefix}${url.pathname === "/" ? "" : url.pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};