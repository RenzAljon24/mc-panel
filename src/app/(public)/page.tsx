import { getServerStats } from "@/lib/site";

export const revalidate = 10;
import {
  SERVER_TAGLINE,
  DEFAULT_SERVER_IP,
  JAVA_PORT,
  BEDROCK_PORT,
} from "@/lib/site-content";
import { IpCopyButton } from "./ip-copy-button";
import { MapPreview } from "./map-preview";
import { UserIcon, ExternalLinkIcon } from "lucide-react";
import { navHref } from "@/lib/nav-links";

function ActivePlayersBadge({
  status,
  onlinePlayers,
  maxPlayers,
}: {
  status: string;
  onlinePlayers: number;
  maxPlayers: number;
}) {
  const isOnline = status === "up";
  return (
    <div
      className={`inline-flex items-center gap-2.5 border px-3.5 py-2 font-mono text-xs ${
        isOnline
          ? "border-[#4ade80]/40 bg-[#4ade80]/5 text-[#4ade80]"
          : "border-[#444] bg-[#444]/5 text-[#666]"
      }`}
      aria-label={
        isOnline
          ? `${onlinePlayers} of ${maxPlayers} players online`
          : "Server offline"
      }
    >
      <span className="relative flex size-5 items-center justify-center">
        <UserIcon className="size-3.5" />
        {isOnline && (
          <span className="absolute -right-0.5 -top-0.5 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#4ade80]" />
          </span>
        )}
      </span>
      <span className="font-bold tracking-wider">
        {isOnline ? `${onlinePlayers} / ${maxPlayers} ONLINE` : "OFFLINE"}
      </span>
    </div>
  );
}

export default async function LandingPage() {
  const stats = await getServerStats();

  const status = stats?.status ?? "idle";
  const onlinePlayers = stats?.onlinePlayers ?? 0;
  const maxPlayers = stats?.server.maxPlayers ?? 20;

  const serverIp = DEFAULT_SERVER_IP;
  const map = navHref("/map");

  return (
    <div className="flex flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#1e1e1e] bg-[#080808]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#4ade80 0,#4ade80 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#4ade80 0,#4ade80 1px,transparent 0,transparent 40px)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5">
              <ActivePlayersBadge
                status={status}
                onlinePlayers={onlinePlayers}
                maxPlayers={maxPlayers}
              />
            </div>

            <h1 className="minecraft-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-[#e8e8e8] mb-4">
              CoreCraft
            </h1>

            <p className="text-base text-[#888] font-mono mb-8 leading-relaxed max-w-xl">
              {SERVER_TAGLINE}
            </p>

            {/* Server addresses — Java + Bedrock side by side */}
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              <div className="border border-[#1e1e1e] bg-[#0f0f0f] p-4 hover:border-[#4ade80]/30 transition-colors">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-block size-2 bg-[#f59e0b]" />
                  <p className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">
                    Java Edition
                  </p>
                </div>
                <IpCopyButton
                  ip={`${serverIp}:${JAVA_PORT}`}
                  label="Java IP"
                  className="w-full"
                />
              </div>

              <div className="border border-[#1e1e1e] bg-[#0f0f0f] p-4 hover:border-[#4ade80]/30 transition-colors">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-block size-2 bg-[#3b82f6]" />
                  <p className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">
                    Bedrock Edition
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IpCopyButton ip={serverIp} label="Bedrock IP" className="flex-1" />
                  <IpCopyButton
                    ip={String(BEDROCK_PORT)}
                    label="Bedrock Port"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE MAP ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-[#e8e8e8]">
              Live Map
            </h2>
            <p className="text-xs font-mono text-[#555] mt-1">
              Real-time view of the world
            </p>
          </div>
          <a
            href={map.href}
            className="flex items-center gap-1.5 text-xs font-mono text-[#4ade80] hover:text-[#86efac] transition-colors"
          >
            Open full map
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>

        <div className="relative border border-[#1e1e1e] bg-[#0a0a0a] overflow-hidden group">
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-60 transition-opacity duration-300 group-hover:opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(8,8,8,0.6) 100%)",
            }}
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 border border-[#4ade80]/40 bg-[#080808]/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#4ade80] backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            Live
          </span>
          <MapPreview />
        </div>
      </section>
    </div>
  );
}
