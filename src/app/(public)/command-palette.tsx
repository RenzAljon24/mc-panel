"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  SearchIcon,
  HomeIcon,
  BookOpenIcon,
  UsersIcon,
  MapIcon,
  ShoppingBagIcon,
  LogInIcon,
  SunIcon,
  MoonIcon,
  XIcon,
  MessageCircleIcon,
} from "lucide-react";
import { DISCORD_URL } from "@/lib/site-content";
import { navHref } from "@/lib/nav-links";

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  path?: string;
  external?: boolean;
  action?: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, [open]);



  const items = useMemo<Item[]>(
    () => {
      const nav = (path: string) => {
        const t = navHref(path);
        return { href: t.href, external: t.external, path };
      };
      return [
      { id: "nav-home", label: "Home", group: "Navigation", icon: HomeIcon, ...nav("/") },
      { id: "nav-rules", label: "Rules", group: "Navigation", icon: BookOpenIcon, ...nav("/rules") },
      { id: "nav-staff", label: "Staff", group: "Navigation", icon: UsersIcon, ...nav("/staff") },
      { id: "nav-map", label: "Live Map", group: "Navigation", icon: MapIcon, ...nav("/map") },
      { id: "nav-shop", label: "Shop", hint: "cosmetics & coins — coming soon", group: "Navigation", icon: ShoppingBagIcon, ...nav("/shop") },
      ...(DISCORD_URL
        ? [
          {
            id: "social-discord",
            label: "Join our Discord",
            hint: DISCORD_URL,
            group: "Social",
            icon: MessageCircleIcon,
            action: () => {
              window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
              onOpenChange(false);
            },
          } satisfies Item,
        ]
        : []),
    ];
    },
    [onOpenChange],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.group.toLowerCase().includes(q) ||
        (it.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return [...map.entries()];
  }, [filtered]);

  // Reset state when opening — focus the user's current page
  useEffect(() => {
    if (open) {
      setQuery("");
      const currentIdx = items.findIndex((it) => it.path && it.path === pathname);
      setActiveIdx(currentIdx >= 0 ? currentIdx : 0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, items, pathname]);

  // Clamp active index when filter changes
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIdx]);

  // Mount/unmount with transition: keep mounted briefly after close so the
  // exit animation can play, then unmount.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // next frame → flip to visible so transition runs from initial styles
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(t);
  }, [open]);

  // Lock body scroll while mounted
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  const selectItem = useCallback(
    (it: Item) => {
      if (it.action) {
        it.action();
        return;
      }
      if (it.href) {
        onOpenChange(false);
        if (it.external) {
          window.location.href = it.href;
        } else {
          router.push(it.href);
        }
      }
    },
    [onOpenChange, router],
  );

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) selectItem(it);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  }

  if (!mounted) return null;

  let runningIndex = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      data-state={visible ? "open" : "closed"}
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-16 sm:pt-24"
      onKeyDown={onKey}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"
          }`}
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-xl border border-[#2a2a2a] bg-[#0f0f0f] shadow-2xl shadow-black/50 transition-all duration-200 ease-out ${visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-3 scale-[0.98]"
          }`}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4">
          <SearchIcon className="h-4 w-4 text-[#666] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type a command or search…"
            className="flex-1 bg-transparent py-3.5 font-mono text-sm text-[#e8e8e8] placeholder:text-[#444] focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close palette"
            className="text-[#666] hover:text-[#e8e8e8] transition-colors p-1 -mr-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {grouped.length === 0 ? (
            <p className="px-4 py-6 text-center font-mono text-xs text-[#666]">
              No matches.
            </p>
          ) : (
            grouped.map(([group, its]) => (
              <div key={group} className="mb-1">
                <div className="px-4 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-[#555]">
                  {group}
                </div>
                {its.map((it) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  const active = idx === activeIdx;
                  const isCurrent = it.path ? pathname === it.path : false;
                  const Icon = it.icon;
                  const common =
                    "flex w-full items-center gap-3 px-4 py-2 text-left font-mono text-sm transition-colors relative";
                  const tone = active
                    ? "bg-[#1a1a1a] text-[#e8e8e8]"
                    : isCurrent
                      ? "text-[#4ade80] hover:bg-[#1a1a1a]"
                      : "text-[#cfcfcf] hover:bg-[#1a1a1a]";
                  const content = (
                    <>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-[#4ade80]"
                        />
                      )}
                      <Icon
                        className={`h-4 w-4 shrink-0 ${isCurrent ? "text-[#4ade80]" : ""}`}
                      />
                      <span className="flex-1 truncate">{it.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider text-[#4ade80]/70">
                          current
                        </span>
                      )}
                    </>
                  );
                  return it.href ? (
                    it.external ? (
                      <a
                        key={it.id}
                        href={it.href}
                        onClick={() => onOpenChange(false)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`${common} ${tone}`}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        key={it.id}
                        href={it.href}
                        onClick={() => onOpenChange(false)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`${common} ${tone}`}
                      >
                        {content}
                      </Link>
                    )
                  ) : (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => selectItem(it)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`${common} ${tone}`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1e1e1e] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#555]">
          <span>
            <kbd className="border border-[#2a2a2a] px-1.5 py-0.5 text-[#888]">↑↓</kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="border border-[#2a2a2a] px-1.5 py-0.5 text-[#888]">⏎</kbd>{" "}
            select
          </span>
          <span>
            <kbd className="border border-[#2a2a2a] px-1.5 py-0.5 text-[#888]">esc</kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
