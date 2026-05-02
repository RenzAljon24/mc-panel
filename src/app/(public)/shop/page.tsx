import type { Metadata } from "next";
import Link from "next/link";
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
  {
    id: "cosmetics2",
    name: "Battle Pass",
    tier: "Progression",
    rarity: "rare",
    icon: SparklesIcon,
    blurb: "Seasonal rewards and exclusive cosmetics unlock as you progress.",
    accent: "#86efac",
  },
  {
    id: "bundle",
    name: "Starter Bundle",
    tier: "Value Pack",
    rarity: "epic",
    icon: PackageIcon,
    blurb: "Everything you need to jump start your CoreCraft journey.",
    accent: "#fbbf24",
  },
] as const;

export default function ShopComingSoonPage() {
  return (
    <div className="relative isolate overflow-hidden min-h-screen bg-[#0f0f0f]">
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
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[860px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #4ade80 0%, #22d3ee 40%, transparent 70%)",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        {/* ── Logo/Title ────────────────────────────────────────────────── */}
        <div className="mb-12">
          <h1 className="minecraft-title font-mono text-3xl sm:text-4xl font-bold text-[#e8e8e8]">
            CoreCraft Shop
          </h1>
        </div>

        {/* ── Product Categories Grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {PREVIEW_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="group relative border border-[#2a2a2a] bg-[#0a0a0a] p-8 transition-all hover:border-[#4ade80]/50 hover:shadow-lg hover:shadow-[#4ade80]/20"
              >
                {/* Icon container */}
                <div className="flex justify-center mb-6">
                  <div
                    className="flex h-16 w-16 items-center justify-center"
                    style={{ color: item.accent }}
                  >
                    <Icon className="h-10 w-10" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-center font-mono text-sm font-semibold text-[#e8e8e8] mb-2">
                  {item.name}
                </h3>

                {/* Description */}
                <p className="text-center text-xs leading-relaxed text-[#888] mb-4">
                  {item.blurb}
                </p>

                {/* Coming Soon Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#4ade80]">
                    <LockIcon className="h-3 w-3" />
                    coming soon
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Welcome Section ────────────────────────────────────────────── */}
        <div className="mb-16 border-t border-[#1e1e1e] pt-12">
          <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#e8e8e8] mb-4">
            Welcome
          </h2>
          <div className="max-w-3xl">
            <p className="text-sm leading-relaxed text-[#999] mb-4">
              Welcome to the CoreCraft Shop! This is your destination for exclusive cosmetics,
              coins, ranks, and mystery crates to enhance your gameplay. We offer a curated selection
              of items designed to let you customize your experience while maintaining fair gameplay.
            </p>
            <p className="text-sm leading-relaxed text-[#999] mb-6">
              All payments are handled securely. Shop launches soon—stay tuned!
            </p>

            {/* ── Back Link ───────────────────────────────────────────── */}
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest text-[#666] hover:text-[#4ade80] transition-colors"
            >
              ← back to home
            </Link>
          </div>
        </div>

        {/* ── Commitment Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <CommitmentCard
            title="No pay-to-win"
            body="Anything that affects gameplay balance stays earnable in-game."
          />
          <CommitmentCard
            title="Supports the server"
            body="Purchases keep the lights on — bare-metal hosting, backups, and mod tooling."
          />
          <CommitmentCard
            title="Refundable in 7 days"
            body="Change your mind on a cosmetic? Hit up staff within a week."
          />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#1e1e1e] bg-[#0a0a0a]/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 font-mono text-[11px] uppercase tracking-widest text-[#555]">
          <span className="inline-flex items-center gap-2">
            <ShoppingBagIcon className="h-3.5 w-3.5" />
            corecraft / shop
          </span>
        </div>
      </section>
    </div>
  );
}

function CommitmentCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[#2a2a2a] bg-[#0d0d0d] p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#4ade80]">
        ▸ {title}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[#888]">{body}</p>
    </div>
  );
}
