"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MenuIcon, XIcon } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rules", label: "Rules" },
  { href: "/staff", label: "Staff" },
  { href: "/map", label: "Live Map" },
] as const;

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 text-xs font-mono tracking-wide transition-colors rounded",
              pathname === link.href
                ? "text-[#4ade80] bg-[#4ade80]/10"
                : "text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1a]"
            )}
          >
            {link.label}
          </Link>
        ))}
        <div className="ml-3 pl-3 border-l border-[#2a2a2a]">
          <Link
            href="/login"
            className="inline-flex items-center px-3 py-1.5 text-xs font-mono border border-[#2a2a2a] bg-transparent text-[#888] hover:text-[#4ade80] hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-all rounded"
          >
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 text-[#888] hover:text-[#e8e8e8] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-40 border-b border-[#1e1e1e] bg-[#0d0d0d]/98 backdrop-blur-sm px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "px-3 py-2.5 text-sm font-mono tracking-wide transition-colors rounded",
                pathname === link.href
                  ? "text-[#4ade80] bg-[#4ade80]/10"
                  : "text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1a]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-[#1e1e1e]">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm font-mono text-[#4ade80] hover:bg-[#4ade80]/10 rounded transition-colors"
            >
              Admin Login →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
