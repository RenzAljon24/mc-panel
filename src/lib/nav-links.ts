const SUBDOMAIN_PATHS: Record<string, string> = {
  "/shop": "shop",
  "/map": "map",
  "/servers": "servers",
};

export type NavTarget = { href: string; external: boolean };

export function navHref(path: string): NavTarget {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (!baseDomain) return { href: path, external: false };

  const matchedKey = Object.keys(SUBDOMAIN_PATHS).find(
    (key) => path === key || path.startsWith(`${key}/`),
  );
  if (!matchedKey) return { href: path, external: false };

  const sub = SUBDOMAIN_PATHS[matchedKey];
  const rest = path.slice(matchedKey.length) || "/";
  return { href: `https://${sub}.${baseDomain}${rest}`, external: true };
}
