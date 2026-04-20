import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { listPlayers } from "@/lib/rcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle>
            Players online ({players.length} / {server.maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {status === "up" ? "No players online" : "Server is idle — join to wake it up"}
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {players.map((p) => (
                <li key={p} className="font-mono">
                  {p}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentEvents.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="font-mono">{e.kind}</span>
                  <span className="text-muted-foreground">
                    {e.createdAt.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
