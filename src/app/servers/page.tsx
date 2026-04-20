import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";

export default async function ServersPage() {
  const servers = await prisma.server.findMany({ orderBy: { createdAt: "asc" } });

  const withStatus = await Promise.all(
    servers.map(async (s) => ({ ...s, liveStatus: await getStatus(s.id) })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-sm font-mono font-semibold tracking-widest uppercase text-foreground">
          Servers
        </h1>
        <span className="text-xs text-muted-foreground font-mono">{servers.length} server(s)</span>
      </div>

      {withStatus.length === 0 ? (
        <div className="border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No servers yet. Run the seed script to create one.
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {/* Header row */}
          <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 items-center px-5 py-2">
            <span />
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Name</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Version</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Ports</span>
          </div>
          {withStatus.map((s) => (
            <Link
              key={s.id}
              href={`/servers/${s.id}`}
              className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-accent transition-colors"
            >
              {/* Status dot */}
              <span className="flex items-center">
                <StatusDot status={s.liveStatus} />
              </span>
              {/* Name + meta */}
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                  {s.ramMb} MB RAM · online-mode={String(s.onlineMode)} · whitelist={String(s.whitelist)}
                </div>
              </div>
              {/* Version */}
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {s.jarType} {s.jarVersion}
              </span>
              {/* Ports */}
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap text-right">
                :{s.portJava} / :{s.portBedrock}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "up"
      ? "bg-green-500"
      : status === "starting" || status === "stopping"
      ? "bg-yellow-400"
      : status === "error"
      ? "bg-red-500"
      : "bg-gray-300";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={status}
    />
  );
}
