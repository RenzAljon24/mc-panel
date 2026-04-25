import type { Metadata } from "next";
import Link from "next/link";
import { ShopCountdown } from "./countdown";
import { NotifyForm } from "./notify-form";
import {
  CoinsIcon,
  SparklesIcon,
  CrownIcon,
  PackageIcon,
  ShoppingBagIcon,
  LockIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Shop — Coming Soon · CoreCraft",
  description:
    "Cosmetics, coins, ranks, and crate keys are landing in the CoreCraft shop soon.",
};

const PREVIEW_ITEMS = [
  {
    id: "coins",
    name: "CoreCoins",
    tier: "Currency",
    rarity: "common",
    icon: CoinsIcon,
    blurb: "Spendable currency for cosmetics, perks, and trades.",
    accent: "#facc15",
  },
  {
    id: "cosmetics",
    name: "Cosmetic Pack",
    tier: "Vanity",
    rarity: "rare",
    icon: SparklesIcon,
    blurb: "Hats, capes, particle trails, and emotes — pure flex, zero P2W.",
    accent: "#60a5fa",
  },
  {
    id: "rank",
    name: "Champion Rank",
    tier: "Membership",
    rarity: "epic",
    icon: CrownIcon,
    blurb: "Coloured chat tag, /fly in lobby, and 2× daily rewards.",
    accent: "#c084fc",
  },
  {
    id: "crate",
    name: "Mystery Crate",
    tier: "Loot",
    rarity: "legendary",
    icon: PackageIcon,
    blurb: "Sealed loot crate. Roll for cosmetics, coins, and rare drops.",
    accent: "#f472b6",
  },
] as const;

export default function ShopComingSoonPage() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* ── Backdrop: grid + radial glow ─────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[860px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #4ade80 0%, #22d3ee 40%, transparent 70%)",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
        {/* ── Header chip ────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#0f0f0f]/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#888] backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
            </span>
            Restocking the shelves
          </div>
        </div>

        {/* ── Headline ───────────────────────────────────────────────── */}
        <div className="mt-6 text-center">
          <h1 className="font-mono text-4xl sm:text-6xl font-bold tracking-tight text-[#e8e8e8]">
            <span className="bg-gradient-to-br from-[#4ade80] via-[#86efac] to-[#22d3ee] bg-clip-text text-transparent">
              Shop
            </span>{" "}
            <span className="text-[#888]">— coming soon</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-sm sm:text-base leading-relaxed text-[#999]">
            Cosmetics, coins, ranks, and crate keys are being forged in the
            workshop.
          </p>
        </div>

        {/* ── Countdown ──────────────────────────────────────────────── */}
        <ShopCountdown />

        {/* ── CTA row ────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <NotifyForm />
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-[#666] hover:text-[#e8e8e8] transition-colors"
          >
            ← back to home
          </Link>
        </div>
      </section>

      {/* ── Preview grid ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">
              Preview · v0
            </p>
            <h2 className="mt-1 font-mono text-lg sm:text-xl text-[#e8e8e8]">
              What's landing in the launch drop
            </h2>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#555]">
            <LockIcon className="h-3 w-3" /> locked until launch
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PREVIEW_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="group relative overflow-hidden border border-[#1e1e1e] bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] p-5 transition-all hover:border-[#2a2a2a] hover:-translate-y-0.5"
              >
                {/* hover glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-30"
                  style={{ background: item.accent }}
                />

                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center border border-[#2a2a2a] bg-[#0a0a0a]"
                    style={{ color: item.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: item.accent }}
                  >
                    {item.rarity}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#555]">
                    {item.tier}
                  </p>
                  <h3 className="mt-0.5 font-mono text-sm font-semibold text-[#e8e8e8]">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#888]">
                    {item.blurb}
                  </p>
                </div>

                {/* locked footer */}
                <div className="mt-5 flex items-center justify-between border-t border-[#1a1a1a] pt-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#444]">
                    <LockIcon className="h-3 w-3" />
                    soon
                  </span>
                  <span className="font-mono text-[10px] text-[#333]">
                    ░░░░░░░
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── No-P2W disclaimer card ─────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DisclaimerCard
            title="No pay-to-win"
            body="Anything that affects gameplay balance stays earnable in-game."
          />
          <DisclaimerCard
            title="Supports the server"
            body="Purchases keep the lights on — bare-metal hosting, backups, mod tooling."
          />
          <DisclaimerCard
            title="Refundable in 7 days"
            body="Change your mind on a cosmetic? Hit up staff within a week."
          />
        </div>
      </section>

      {/* ── Footer strip ──────────────────────────────────────────────── */}
      <section className="border-t border-[#1e1e1e] bg-[#0a0a0a]/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-6 font-mono text-[11px] uppercase tracking-widest text-[#555]">
          <span className="inline-flex items-center gap-2">
            <ShoppingBagIcon className="h-3.5 w-3.5" />
            corecraft / shop
          </span>
          <span>build 0.1 · staging</span>
        </div>
      </section>
    </div>
  );
}

function DisclaimerCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#4ade80]">
        ▸ {title}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[#888]">{body}</p>
    </div>
  );
}
