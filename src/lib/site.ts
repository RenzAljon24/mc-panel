/**
 * site.ts — Server-side helpers for the public landing page.
 * These functions are safe to call from async server components.
 */

import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { listPlayers } from "@/lib/rcon";
import type { ServerStatus } from "@/lib/systemd";

export type PrimaryServer = {
  id: string;
  name: string;
  jarType: string;
  jarVersion: string;
  portJava: number;
  portBedrock: number;
  portRcon: number;
  rconPassword: string;
  maxPlayers: number;
  motd: string;
};

export type ServerStats = {
  server: PrimaryServer;
  status: ServerStatus;
  /** null = RCON unavailable / error */
  onlinePlayers: number | null;
};

/** Returns the first Server row (ordered by createdAt asc), or null. */
export async function getPrimaryServer(): Promise<PrimaryServer | null> {
  const server = await prisma.server.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      jarType: true,
      jarVersion: true,
      portJava: true,
      portBedrock: true,
      portRcon: true,
      rconPassword: true,
      maxPlayers: true,
      motd: true,
    },
  });
  return server ?? null;
}

/**
 * Returns combined server info + live status + online player count.
 * Never throws — errors produce null/0 for online count.
 */
export async function getServerStats(): Promise<ServerStats | null> {
  const server = await getPrimaryServer();
  if (!server) return null;

  const status = await getStatus(server.id);

  let onlinePlayers: number | null = null;
  if (status === "up") {
    try {
      const players = await listPlayers({
        host: "127.0.0.1",
        port: server.portRcon,
        password: server.rconPassword,
      });
      onlinePlayers = players.length;
    } catch {
      onlinePlayers = null;
    }
  } else {
    onlinePlayers = 0;
  }

  return { server, status, onlinePlayers };
}
