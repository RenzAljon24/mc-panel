"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Dashboard" },
  { href: "/console", label: "Console" },
  { href: "/power", label: "Power" },
  { href: "/players", label: "Players" },
  { href: "/map", label: "Map" },
  { href: "/settings", label: "Settings" },
  { href: "/plugins", label: "Plugins" },
  { href: "/files", label: "Files" },
  { href: "/backups", label: "Backups" },
] as const;

export function ServerTabs({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const base = `/servers/${serverId}`;
  return (
    <nav className="flex border-b border-border mt-1 mb-0">
      {TABS.map((t) => {
        const href = `${base}${t.href}`;
        const active =
          t.href === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={t.href}
            href={href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-xs font-mono transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
