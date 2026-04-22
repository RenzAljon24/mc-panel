import Link from "next/link";
import { getPrimaryServer } from "@/lib/site";
import { PublicNav } from "./public-nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const server = await getPrimaryServer();
  const serverName = server?.name ?? "MC Server";

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-[#e8e8e8]">
      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0d0d0d]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-[#4ade80] hover:text-[#86efac] transition-colors"
          >
            <span className="minecraft-title text-xs leading-none">⛏</span>
            <span className="hidden sm:inline">{serverName.toUpperCase()}</span>
            <span className="sm:hidden">MC</span>
          </Link>

          {/* Desktop nav + login */}
          <PublicNav />
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e1e1e] bg-[#0a0a0a] py-8 mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#555] font-mono">
            <span>© {new Date().getFullYear()} {serverName}. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a
                href="https://discord.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#7289da] transition-colors"
                aria-label="Join our Discord"
              >
                Discord
              </a>
              <span className="text-[#333]">·</span>
              <span className="text-[#333]">Powered by mc-panel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
