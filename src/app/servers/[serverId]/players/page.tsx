import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { listPlayers, mockRoster, runCommand } from "@/lib/rcon";
import { MOCK_INFRA } from "@/lib/mock";
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
    <div className="space-y-4">
      {/* Online players */}
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Online{" "}
            <span className="text-foreground">
              {online.length} / {server.maxPlayers}
            </span>
          </h2>
        </div>
        <div className="px-5 py-3">
          {status !== "up" ? (
            <p className="text-sm text-muted-foreground py-2">
              Server is {status}. Start it to see online players.
            </p>
          ) : online.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No players online.</p>
          ) : (
            <ul className="divide-y divide-border">
              {online.map((p) => (
                <li key={p} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{p}</span>
                    {ops.includes(p) && (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">op</span>
                    )}
                    {whitelist.includes(p) && (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">wl</span>
                    )}
                    {p.startsWith(".") && (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">bedrock</span>
                    )}
                  </div>
                  <PlayerActions serverId={server.id} player={p} isOp={ops.includes(p)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Whitelist */}
        <div className="border border-border">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Whitelist <span className="text-foreground">({whitelist.length})</span>
            </h2>
          </div>
          <div className="px-5 py-3 space-y-3">
            {whitelist.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No whitelisted players.</p>
            ) : (
              <ul className="divide-y divide-border">
                {whitelist.map((p) => (
                  <li key={p} className="flex items-center justify-between py-2.5">
                    <span className="font-mono text-sm text-foreground">{p}</span>
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
          </div>
        </div>

        {/* Banned */}
        <div className="border border-border">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Banned <span className="text-foreground">({banned.length})</span>
            </h2>
          </div>
          <div className="px-5 py-3">
            {banned.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No banned players.</p>
            ) : (
              <ul className="divide-y divide-border">
                {banned.map((p) => (
                  <li key={p} className="flex items-center justify-between py-2.5">
                    <span className="font-mono text-sm text-foreground">{p}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
