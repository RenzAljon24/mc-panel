"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { DISCORD_URL } from "@/lib/site-content";
import { navHref } from "@/lib/nav-links";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.369A19.79 19.79 0 0016.558 3a14.39 14.39 0 00-.66 1.36 18.27 18.27 0 00-5.795 0A14.4 14.4 0 009.444 3a19.74 19.74 0 00-3.76 1.37C2.092 9.79 1.107 15.06 1.6 20.25a19.93 19.93 0 006.073 3.07 14.78 14.78 0 001.299-2.114 12.8 12.8 0 01-2.046-.984c.172-.126.34-.258.502-.394 3.927 1.81 8.18 1.81 12.06 0 .163.136.331.268.503.394-.654.39-1.34.72-2.048.985.378.74.81 1.448 1.299 2.113a19.9 19.9 0 006.075-3.07c.577-6.024-.974-11.247-4.094-15.881zM8.02 16.69c-1.183 0-2.156-1.085-2.156-2.418 0-1.333.952-2.418 2.156-2.418 1.205 0 2.176 1.085 2.156 2.418 0 1.333-.951 2.418-2.156 2.418zm7.96 0c-1.183 0-2.156-1.085-2.156-2.418 0-1.333.951-2.418 2.156-2.418 1.205 0 2.176 1.085 2.156 2.418 0 1.333-.951 2.418-2.156 2.418z" />
    </svg>
  );
}

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/rules", label: "Rules" },
  { path: "/staff", label: "Staff" },
  { path: "/map", label: "Live Map" },
  { path: "/shop", label: "Shop" },
] as const;

export function PublicNav() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const links = useMemo(
    () => NAV_LINKS.map((l) => ({ ...l, ...navHref(l.path) })),
    [],
  );

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
      /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent),
    );
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <nav
        className="hidden md:flex items-center gap-1"
        aria-label="Main navigation"
      >
        {links.map((link) => {
          const isActive = pathname === link.path;
          const className = cn(
            "px-3 py-1.5 text-xs font-mono tracking-wide transition-colors rounded",
            isActive
              ? "text-[#4ade80] bg-[#4ade80]/10"
              : "text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1a]",
          );
          return link.external ? (
            <a key={link.path} href={link.href} className={className}>
              {link.label}
            </a>
          ) : (
            <Link key={link.path} href={link.href} className={className}>
              {link.label}
            </Link>
          );
        })}
        <div className="ml-3 pl-3 border-l border-[#2a2a2a] flex items-center gap-2">
          {DISCORD_URL && (
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Discord"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono border border-[#2a2a2a] bg-transparent text-[#888] hover:text-[#7289da] hover:border-[#7289da] hover:bg-[#7289da]/5 transition-all rounded"
            >
              <DiscordIcon className="h-3.5 w-3.5" />
              <span>Discord</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
            className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-mono border border-[#2a2a2a] bg-[#111] text-[#888] hover:text-[#e8e8e8] hover:border-[#3a3a3a] transition-all rounded"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            <span>search</span>
            <kbd className="hidden lg:inline-flex items-center border border-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-[#666]">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
        </div>
      </nav>

      <button
        type="button"
        className="md:hidden p-2 text-[#888] hover:text-[#e8e8e8] transition-colors"
        onClick={() => setPaletteOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="size-5" />
      </button>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
