import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Activity, Users, Gauge, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { listPlayers } from "@/lib/rcon";
import { AutoRefresh } from "./auto-refresh";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();
  const server = await prisma.server.findFirst({
    where: { id: serverId, ownerId: session.user.id },
  });
  if (!server) notFound();

  const status = await getStatus(server.id);
  let players: string[] = [];
  let rconError: string | null = null;
  if (status === "up") {
    try {
      players = await listPlayers({
        host: "127.0.0.1",
        port: server.portRcon,
        password: server.rconPassword,
      });
    } catch (err) {
      rconError = err instanceof Error ? err.message : "RCON failed";
      console.error(`[dashboard] listPlayers failed for ${server.id}:`, err);
      players = [];
    }
  }

  const recentEvents = await prisma.auditEvent.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const isOnline = status === "up";
  const capacityPct = Math.min(
    100,
    Math.round((players.length / Math.max(server.maxPlayers, 1)) * 100),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <AutoRefresh intervalMs={10000} />

      {/* Stat cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Status"
          icon={<Activity className="h-4 w-4" />}
          value={status.toUpperCase()}
          tone={
            isOnline
              ? "good"
              : status === "starting" || status === "stopping"
                ? "warn"
                : status === "error"
                  ? "bad"
                  : "muted"
          }
        />
        <StatCard
          label="Players"
          icon={<Users className="h-4 w-4" />}
          value={`${players.length} / ${server.maxPlayers}`}
          tone={isOnline ? "good" : "muted"}
        />
        <StatCard
          label="Capacity"
          icon={<Gauge className="h-4 w-4" />}
          value={`${capacityPct}%`}
          tone="muted"
          extra={
            <div className="mt-2 h-1.5 w-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          }
        />
        <StatCard
          label="Version"
          icon={<Activity className="h-4 w-4" />}
          value={`${server.jarType} ${server.jarVersion}`}
          tone="muted"
          mono
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Players Panel */}
        <Panel
          title="Players Online"
          subtitle={`${players.length} of ${server.maxPlayers}`}
          className="lg:col-span-2"
        >
          {rconError ? (
            <div className="flex items-start gap-2 border border-red-500/40 bg-red-500/5 p-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs font-mono text-red-500 wrap-break-word">
                RCON error: {rconError}
              </div>
            </div>
          ) : !isOnline ? (
            <EmptyState message={`Server is ${status}.`} hint="Start it to see online players." />
          ) : players.length === 0 ? (
            <EmptyState message="No players online." hint="Share the IP with friends to get started." />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {players.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-3 border border-border bg-background px-3 py-2"
                >
                  <Avatar name={p} />
                  <span className="font-mono text-sm text-foreground truncate">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Activity Panel */}
        <Panel title="Recent Activity">
          {recentEvents.length === 0 ? (
            <EmptyState message="No recent events." />
          ) : (
            <ol className="space-y-3 max-h-96 overflow-auto">
              {recentEvents.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 bg-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {e.kind.toUpperCase()}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {e.createdAt.toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  extra,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "good" | "bad" | "warn" | "muted";
  extra?: React.ReactNode;
  mono?: boolean;
}) {
  const accent =
    tone === "good"
      ? "text-green-600 dark:text-green-400"
      : tone === "bad"
        ? "text-red-500"
        : tone === "warn"
          ? "text-yellow-500"
          : "text-foreground";
  return (
    <div className="border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest">
          {label}
        </span>
        <span className={accent}>{icon}</span>
      </div>
      <div
        className={`mt-2 ${mono ? "font-mono text-sm" : "text-lg sm:text-xl font-bold"} ${accent} truncate`}
      >
        {value}
      </div>
      {extra}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-border bg-card flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-5 py-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
          {title}
        </h2>
        {subtitle && (
          <span className="text-[11px] font-mono text-muted-foreground">{subtitle}</span>
        )}
      </header>
      <div className="p-4 sm:p-5 flex-1">{children}</div>
    </section>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="text-center py-6 space-y-1">
      <p className="text-sm text-muted-foreground font-mono">{message}</p>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const username = name.startsWith(".") ? name.slice(1) : name;
  return (
    <img
      src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/24`}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 shrink-0 border border-border bg-muted"
      loading="lazy"
    />
  );
}
