"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  Power,
  Users,
  Map,
  Settings,
  Puzzle,
  Folder,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/console", label: "Console", icon: Terminal },
  { href: "/power", label: "Power", icon: Power },
  { href: "/players", label: "Players", icon: Users },
  { href: "/map", label: "Map", icon: Map },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/plugins", label: "Plugins", icon: Puzzle },
  { href: "/files", label: "Files", icon: Folder },
  { href: "/backups", label: "Backups", icon: Archive },
] as const;

export function ServerTabs({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const base = `/servers/${serverId}`;

  return (
    <nav
      aria-label="Server sections"
      className="relative -mx-4 sm:mx-0 overflow-x-auto overflow-y-hidden border-b border-border
                 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-max items-stretch gap-1 px-4 sm:px-0">
        {TABS.map((t) => {
          const href = `${base}${t.href}`;
          const active =
            t.href === ""
              ? pathname === base
              : pathname === href || pathname.startsWith(`${href}/`);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2 px-3 sm:px-4 py-2.5 -mb-px",
                  "text-xs font-mono tracking-wide uppercase whitespace-nowrap",
                  "border-b-2 transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
