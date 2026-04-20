import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { listPlayers, mockRoster, runCommand } from "@/lib/rcon";
import { MOCK_INFRA } from "@/lib/mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerActions, AddToList } from "./player-actions";

export default async function PlayersPage({
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
  const target = { host: "127.0.0.1", port: server.portRcon, password: server.rconPassword };

  let online: string[] = [];
  let ops: string[] = [];
  let whitelist: string[] = [];
  let banned: string[] = [];

  if (status === "up") {
    try {
      online = await listPlayers(target);
    } catch {
      online = [];
    }
    if (MOCK_INFRA) {
      ({ ops, whitelist, banned } = mockRoster());
    } else {
      try {
        const raw = await runCommand(target, "whitelist list");
        const m = raw.match(/whitelisted players:\s*(.*)$/i);
        whitelist = m && m[1].trim() ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
      } catch {
        whitelist = [];
      }
    }
  } else if (MOCK_INFRA) {
    ({ whitelist, ops, banned } = mockRoster());
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Online ({online.length} / {server.maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status !== "up" ? (
            <p className="text-muted-foreground text-sm">
              Server is {status}. Start it to see online players.
            </p>
          ) : online.length === 0 ? (
            <p className="text-muted-foreground text-sm">No players online.</p>
          ) : (
            <ul className="divide-y">
              {online.map((p) => (
                <li key={p} className="flex items-center justify-between gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{p}</span>
                    {ops.includes(p) && <Badge variant="secondary">op</Badge>}
                    {whitelist.includes(p) && <Badge variant="outline">whitelisted</Badge>}
                    {p.startsWith(".") && <Badge>bedrock</Badge>}
                  </div>
                  <PlayerActions serverId={server.id} player={p} isOp={ops.includes(p)} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Whitelist ({whitelist.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {whitelist.length === 0 ? (
              <p className="text-muted-foreground text-sm">No whitelisted players.</p>
            ) : (
              <ul className="divide-y">
                {whitelist.map((p) => (
                  <li key={p} className="flex items-center justify-between py-2">
                    <span className="font-mono text-sm">{p}</span>
                    <PlayerActions
                      serverId={server.id}
                      player={p}
                      isOp={ops.includes(p)}
                      context="whitelist"
                    />
                  </li>
                ))}
              </ul>
            )}
            <AddToList serverId={server.id} kind="whitelist" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banned ({banned.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {banned.length === 0 ? (
              <p className="text-muted-foreground text-sm">No banned players.</p>
            ) : (
              <ul className="divide-y">
                {banned.map((p) => (
                  <li key={p} className="flex items-center justify-between py-2">
                    <span className="font-mono text-sm">{p}</span>
                    <PlayerActions
                      serverId={server.id}
                      player={p}
                      isOp={false}
                      context="banned"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
