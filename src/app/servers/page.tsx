import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";

export default async function ServersPage() {
  const servers = await prisma.server.findMany({ orderBy: { createdAt: "asc" } });

  const withStatus = await Promise.all(
    servers.map(async (s) => ({ ...s, liveStatus: await getStatus(s.id) })),
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4 gap-3">
        <h1 className="text-sm font-mono font-semibold tracking-widest uppercase text-foreground">
          Servers
        </h1>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {servers.length} server{servers.length === 1 ? "" : "s"}
        </span>
      </div>

      {withStatus.length === 0 ? (
        <div className="border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No servers yet. Run the seed script to create one.
        </div>
      ) : (
        <>
          {/* Mobile: card grid */}
          <div className="grid gap-3 sm:hidden">
            {withStatus.map((s) => (
              <Link
                key={s.id}
                href={`/servers/${s.id}`}
                className="block border border-border p-4 hover:bg-accent transition-colors active:bg-accent/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <StatusDot status={s.liveStatus} className="mt-1.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {s.jarType} {s.jarVersion}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={s.liveStatus} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
                  <div>
                    <span className="text-foreground/60">RAM</span> {s.ramMb}MB
                  </div>
                  <div>
                    <span className="text-foreground/60">Java</span> :{s.portJava}
                  </div>
                  <div>
                    <span className="text-foreground/60">Bedrock</span> :{s.portBedrock}
                  </div>
                  <div>
                    <span className="text-foreground/60">WL</span> {String(s.whitelist)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block border border-border divide-y divide-border">
            <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-4 items-center px-5 py-2 bg-accent/30">
              <span />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Name</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Status</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Version</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Ports</span>
            </div>
            {withStatus.map((s) => (
              <Link
                key={s.id}
                href={`/servers/${s.id}`}
                className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-accent transition-colors"
              >
                <span className="flex items-center">
                  <StatusDot status={s.liveStatus} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                    {s.ramMb} MB RAM · online-mode={String(s.onlineMode)} · whitelist={String(s.whitelist)}
                  </div>
                </div>
                <StatusBadge status={s.liveStatus} />
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {s.jarType} {s.jarVersion}
                </span>
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap text-right">
                  :{s.portJava} / :{s.portBedrock}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusDot({ status, className = "" }: { status: string; className?: string }) {
  const color =
    status === "up"
      ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]"
      : status === "starting" || status === "stopping"
        ? "bg-yellow-400 animate-pulse"
        : status === "error"
          ? "bg-red-500"
          : "bg-gray-400";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color} ${className}`}
      title={status}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "up"
      ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
      : status === "starting" || status === "stopping"
        ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
        : status === "error"
          ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${styles}`}
    >
      {status}
    </span>
  );
}
