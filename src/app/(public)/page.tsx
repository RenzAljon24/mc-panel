import Link from "next/link";
import { getServerStats } from "@/lib/site";

export const revalidate = 10;
import {
  SERVER_TAGLINE,
  DEFAULT_SERVER_IP,
  JAVA_PORT,
  BEDROCK_PORT,
  RULES,
  STAFF,
} from "@/lib/site-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IpCopyButton } from "./ip-copy-button";
import { MapPreview } from "./map-preview";
import {
  UsersIcon,
  ServerIcon,
  LayersIcon,
  WifiIcon,
  ArrowDownIcon,
  ExternalLinkIcon,
  ShieldIcon,
  HammerIcon,
  StarIcon,
  SwordIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const isOnline = status === "up";
  const isStarting = status === "starting" || status === "stopping";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border ${
        isOnline
          ? "border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]"
          : isStarting
          ? "border-[#facc15] bg-[#facc15]/10 text-[#facc15]"
          : "border-[#666] bg-[#666]/10 text-[#666]"
      }`}
      aria-label={`Server is ${isOnline ? "online" : isStarting ? "starting" : "offline"}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          isOnline
            ? "bg-[#4ade80] animate-pulse"
            : isStarting
            ? "bg-[#facc15] animate-pulse"
            : "bg-[#666]"
        }`}
      />
      {isOnline ? "ONLINE" : isStarting ? "STARTING" : "OFFLINE"}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="bg-[#111] border-[#1e1e1e] hover:border-[#4ade80]/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-[#555] uppercase tracking-widest mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-[#e8e8e8] font-mono group-hover:text-[#4ade80] transition-colors duration-300">
              {value}
            </p>
            {sub && (
              <p className="text-xs text-[#444] font-mono mt-1">{sub}</p>
            )}
          </div>
          <span className="text-[#333] group-hover:text-[#4ade80]/60 transition-colors duration-300 shrink-0">
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Owner:
      "border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]",
    Admin:
      "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]",
    Moderator:
      "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]",
    Builder:
      "border-[#a855f7] bg-[#a855f7]/10 text-[#a855f7]",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold border ${
        styles[role] ?? "border-[#555] bg-[#555]/10 text-[#555]"
      }`}
    >
      {role.toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function LandingPage() {
  const stats = await getServerStats();

  const serverName = stats?.server.name ?? "MC Server";
  const status = stats?.status ?? "idle";
  const onlinePlayers = stats?.onlinePlayers ?? 0;
  const maxPlayers = stats?.server.maxPlayers ?? 20;
  const version = stats
    ? `${stats.server.jarType} ${stats.server.jarVersion}`
    : "Paper 1.21";

  const serverIp = DEFAULT_SERVER_IP;

  return (
    <div className="flex flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#1e1e1e] bg-[#080808]">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#4ade80 0,#4ade80 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#4ade80 0,#4ade80 1px,transparent 0,transparent 40px)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="mb-4">
              <StatusBadge status={status} />
            </div>

            <h1 className="minecraft-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-[#e8e8e8] mb-4">
              {serverName}
            </h1>

            <p className="text-base sm:text-lg text-[#888] font-mono mb-8 leading-relaxed max-w-xl">
              {SERVER_TAGLINE}
            </p>

            {/* IP copy */}
            <div className="mb-8">
              <IpCopyButton ip={serverIp} variant="hero" />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#connect"
                className="inline-flex items-center gap-2 bg-[#4ade80] text-[#0d0d0d] px-6 py-3 text-sm font-mono font-bold hover:bg-[#86efac] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
              >
                Join Now
                <ArrowDownIcon className="size-4" />
              </a>
              <Link
                href="/rules"
                className="inline-flex items-center gap-2 border border-[#2a2a2a] px-6 py-3 text-sm font-mono text-[#888] hover:text-[#e8e8e8] hover:border-[#444] transition-all duration-200"
              >
                View Rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ─────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <h2 className="sr-only">Server statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<UsersIcon className="size-6" />}
            label="Online Now"
            value={status === "up" ? String(onlinePlayers) : "—"}
            sub={`/ ${maxPlayers} max`}
          />
          <StatCard
            icon={<ServerIcon className="size-6" />}
            label="Status"
            value={
              status === "up"
                ? "Online"
                : status === "starting"
                ? "Starting"
                : "Offline"
            }
            sub="24/7 uptime target"
          />
          <StatCard
            icon={<LayersIcon className="size-6" />}
            label="Version"
            value={version.split(" ")[1] ?? version}
            sub={version.split(" ")[0]}
          />
          <StatCard
            icon={<WifiIcon className="size-6" />}
            label="Crossplay"
            value="Java + BE"
            sub={`Java :${JAVA_PORT} · Bedrock :${BEDROCK_PORT}`}
          />
        </div>
      </section>

      <Separator className="bg-[#1a1a1a]" />

      {/* ── LIVE MAP PREVIEW ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-[#888]">
            Live Map
          </h2>
          <Link
            href="/map"
            className="flex items-center gap-1.5 text-xs font-mono text-[#4ade80] hover:text-[#86efac] transition-colors"
          >
            Open full map
            <ExternalLinkIcon className="size-3" />
          </Link>
        </div>
        <div className="border border-[#1e1e1e] overflow-hidden">
          <MapPreview />
        </div>
      </section>

      <Separator className="bg-[#1a1a1a]" />

      {/* ── HOW TO CONNECT ────────────────────────────────────────────── */}
      <section
        id="connect"
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 scroll-mt-16"
      >
        <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-[#888] mb-6">
          How to Connect
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Java */}
          <Card className="bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#4ade80]/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-mono font-bold text-[#e8e8e8]">
                <span className="inline-block size-2 bg-[#f59e0b]" />
                Java Edition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[#666] font-mono">
                Multiplayer → Direct Connection → paste the address below.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                  Server Address
                </p>
                <IpCopyButton ip={`${serverIp}:${JAVA_PORT}`} label="Java IP" />
              </div>
            </CardContent>
          </Card>

          {/* Bedrock */}
          <Card className="bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#4ade80]/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-mono font-bold text-[#e8e8e8]">
                <span className="inline-block size-2 bg-[#3b82f6]" />
                Bedrock Edition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[#666] font-mono">
                Play → Servers → Add Server → enter the address and port below.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                    Address
                  </p>
                  <IpCopyButton ip={serverIp} label="Bedrock IP" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                    Port
                  </p>
                  <IpCopyButton
                    ip={String(BEDROCK_PORT)}
                    label="Bedrock Port"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="bg-[#1a1a1a]" />

      {/* ── RULES PREVIEW ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-[#888]">
            Rules
          </h2>
          <Link
            href="/rules"
            className="text-xs font-mono text-[#4ade80] hover:text-[#86efac] transition-colors"
          >
            See all rules →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RULES.slice(0, 3).flatMap((cat) =>
            cat.items.slice(0, 2).map((rule, i) => (
              <div
                key={`${cat.category}-${i}`}
                className="flex items-start gap-3 border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3 hover:border-[#2a2a2a] transition-colors"
              >
                <span className="mt-0.5 size-1.5 rounded-full bg-[#4ade80] shrink-0" />
                <p className="text-xs font-mono text-[#888] leading-relaxed">
                  {rule}
                </p>
              </div>
            ))
          ).slice(0, 6)}
        </div>
      </section>

      <Separator className="bg-[#1a1a1a]" />

      {/* ── STAFF PREVIEW ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-[#888]">
            Staff
          </h2>
          <Link
            href="/staff"
            className="text-xs font-mono text-[#4ade80] hover:text-[#86efac] transition-colors"
          >
            See all staff →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAFF.slice(0, 4).map((member) => (
            <Card
              key={member.name}
              className="bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#4ade80]/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  {member.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={member.avatarUrl}
                      alt={`${member.name}'s Minecraft avatar`}
                      className="size-12 border border-[#2a2a2a] bg-[#0a0a0a] pixelated"
                      style={{ imageRendering: "pixelated" }}
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="size-12 border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center">
                      <span className="text-lg font-mono text-[#4ade80]">
                        {member.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-mono font-bold text-[#e8e8e8] truncate w-full">
                    {member.name}
                  </p>
                  <RoleBadge role={member.role} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
