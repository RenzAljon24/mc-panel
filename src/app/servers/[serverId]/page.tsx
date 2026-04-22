import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { listPlayers } from "@/lib/rcon";

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
  if (status === "up") {
    try {
      players = await listPlayers({
        host: "127.0.0.1",
        port: server.portRcon,
        password: server.rconPassword,
      });
    } catch {
      players = [];
    }
  }

  const recentEvents = await prisma.auditEvent.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const isOnline = status === "up";

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-2 border-foreground p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="minecraft-title text-2xl md:text-4xl text-foreground">
              SERVER
            </h1>
            <div className={`w-6 h-6 border-2 border-foreground ${isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {server.name || 'Unnamed Server'}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Players Panel */}
          <div className="border-2 border-foreground flex flex-col">
            <div className="bg-foreground text-background px-6 py-4">
              <h2 className="minecraft-block text-sm md:text-base tracking-widest">
                PLAYERS
              </h2>
            </div>

            <div className="px-6 py-6 flex-1 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-3xl font-bold text-foreground">
                  {players.length}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  / {server.maxPlayers}
                </span>
              </div>

              <div className="border-t border-border pt-4">
                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-mono">
                    {isOnline ? "No players online" : "Server is idle"}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {players.map((p) => (
                      <li
                        key={p}
                        className="font-mono text-sm text-foreground pl-4 border-l-2 border-foreground"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Activity Panel */}
          <div className="border-2 border-foreground flex flex-col">
            <div className="bg-foreground text-background px-6 py-4">
              <h2 className="minecraft-block text-sm md:text-base tracking-widest">
                ACTIVITY
              </h2>
            </div>

            <div className="px-6 py-6 flex-1 overflow-auto max-h-80">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono">
                  No recent events.
                </p>
              ) : (
                <ul className="space-y-4">
                  {recentEvents.map((e, idx) => (
                    <div key={e.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-foreground" />
                        <span className="font-mono text-xs font-bold text-foreground">
                          {e.kind.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono pl-5">
                        {e.createdAt.toLocaleString()}
                      </p>
                      {idx < recentEvents.length - 1 && (
                        <div className="border-t border-border mt-3" />
                      )}
                    </div>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-2 border-foreground p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground">STATUS</p>
              <p className={`font-mono text-xl font-bold ${isOnline ? 'text-green-500' : 'text-red-500'
                }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground">CAPACITY</p>
              <p className="font-mono text-xl font-bold text-foreground">
                {Math.round((players.length / server.maxPlayers) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
