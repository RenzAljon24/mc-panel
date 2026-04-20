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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Players panel */}
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Players online{" "}
            <span className="text-foreground">
              {players.length} / {server.maxPlayers}
            </span>
          </h2>
        </div>
        <div className="px-5 py-4">
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {status === "up" ? "No players online" : "Server is idle — join to wake it up"}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {players.map((p) => (
                <li key={p} className="py-2 font-mono text-sm text-foreground">
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activity panel */}
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Recent activity
          </h2>
        </div>
        <div className="px-5 py-4">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentEvents.map((e) => (
                <li key={e.id} className="flex justify-between gap-2 py-2">
                  <span className="font-mono text-xs text-foreground">{e.kind}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {e.createdAt.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
