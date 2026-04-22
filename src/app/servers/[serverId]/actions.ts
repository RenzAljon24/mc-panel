"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as systemd from "@/lib/systemd";
import { runCommand, type RconTarget } from "@/lib/rcon";
import { appendMockLine } from "@/lib/logs";
import { writeTextFile } from "@/lib/files";
import * as pluginsLib from "@/lib/plugins";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function loadServer(serverId: string) {
  const session = await requireSession();
  const server = await prisma.server.findFirst({
    where: { id: serverId, ownerId: session.user.id },
  });
  if (!server) throw new Error("Server not found");
  return { session, server };
}

function rconTarget(server: { portRcon: number; rconPassword: string }): RconTarget {
  return { host: "127.0.0.1", port: server.portRcon, password: server.rconPassword };
}

export async function startServer(serverId: string) {
  const { server, session } = await loadServer(serverId);
  await systemd.start(server.id);
  await prisma.server.update({ where: { id: server.id }, data: { status: "starting" } });
  await prisma.auditEvent.create({
    data: { serverId: server.id, userId: session.user.id, kind: "server.start" },
  });
  revalidatePath(`/servers/${serverId}`);
}

export async function stopServer(serverId: string) {
  const { server, session } = await loadServer(serverId);
  try {
    await runCommand(rconTarget(server), "stop");
  } catch {
    // fall through — force systemd stop if RCON isn't reachable
  }
  await systemd.stop(server.id);
  await prisma.server.update({ where: { id: server.id }, data: { status: "stopping" } });
  await prisma.auditEvent.create({
    data: { serverId: server.id, userId: session.user.id, kind: "server.stop" },
  });
  revalidatePath(`/servers/${serverId}`);
}

export async function restartServer(serverId: string) {
  const { server, session } = await loadServer(serverId);
  await systemd.restart(server.id);
  await prisma.server.update({
    where: { id: server.id },
    data: { restartRequired: false },
  });
  await prisma.auditEvent.create({
    data: { serverId: server.id, userId: session.user.id, kind: "server.restart" },
  });
  revalidatePath(`/servers/${serverId}`);
}

export async function installPlugin(serverId: string, slug: string): Promise<string> {
  const { server, session } = await loadServer(serverId);
  const result = await pluginsLib.installPluginFromModrinth(server.id, slug);
  await prisma.auditEvent.create({
    data: {
      serverId: server.id,
      userId: session.user.id,
      kind: "plugin.install",
      payloadJson: JSON.stringify({ slug, version: result.version }),
    },
  });
  revalidatePath(`/servers/${serverId}/plugins`);
  return `Installed ${result.name} ${result.version}`;
}

export async function uninstallPlugin(serverId: string, pluginId: string): Promise<void> {
  const { server, session } = await loadServer(serverId);
  await pluginsLib.uninstallPlugin(server.id, pluginId);
  await prisma.auditEvent.create({
    data: {
      serverId: server.id,
      userId: session.user.id,
      kind: "plugin.uninstall",
      payloadJson: JSON.stringify({ pluginId }),
    },
  });
  revalidatePath(`/servers/${serverId}/plugins`);
}

export async function broadcast(serverId: string, message: string) {
  const { server } = await loadServer(serverId);
  await runCommand(rconTarget(server), `say ${message}`);
}

export async function sendConsoleCommand(serverId: string, command: string): Promise<string> {
  const trimmed = command.trim();
  if (!trimmed) throw new Error("Command is empty");
  const { server, session } = await loadServer(serverId);
  const output = await runCommand(rconTarget(server), trimmed);
  appendMockLine(server.id, `[Rcon/${session.user.email}] ${trimmed}`);
  if (output) appendMockLine(server.id, output);
  await prisma.auditEvent.create({
    data: {
      serverId: server.id,
      userId: session.user.id,
      kind: "console.command",
      payloadJson: JSON.stringify({ cmd: trimmed }),
    },
  });
  revalidatePath(`/servers/${serverId}/console`);
  return output;
}

export async function runPlayerAction(
  serverId: string,
  player: string,
  action: "kick" | "ban" | "pardon" | "op" | "deop" | "whitelist-add" | "whitelist-remove",
): Promise<string> {
  if (!/^[A-Za-z0-9_.]{1,32}$/.test(player)) throw new Error("Invalid player name");
  const { server, session } = await loadServer(serverId);
  const cmd =
    action === "whitelist-add"
      ? `whitelist add ${player}`
      : action === "whitelist-remove"
        ? `whitelist remove ${player}`
        : `${action} ${player}`;
  const output = await runCommand(rconTarget(server), cmd);
  appendMockLine(server.id, `[Rcon/${session.user.email}] ${cmd}`);
  await prisma.auditEvent.create({
    data: {
      serverId: server.id,
      userId: session.user.id,
      kind: `player.${action}`,
      payloadJson: JSON.stringify({ player }),
    },
  });
  revalidatePath(`/servers/${serverId}/players`);
  return output;
}

export async function saveServerFile(
  serverId: string,
  subpath: string,
  content: string,
): Promise<void> {
  const { server, session } = await loadServer(serverId);
  await writeTextFile(server.id, subpath, content);
  await prisma.auditEvent.create({
    data: {
      serverId: server.id,
      userId: session.user.id,
      kind: "file.write",
      payloadJson: JSON.stringify({ path: subpath, bytes: content.length }),
    },
  });
  revalidatePath(`/servers/${serverId}/files`);
}

export async function updateSettings(
  serverId: string,
  patch: {
    name?: string;
    motd?: string;
    maxPlayers?: number;
    viewDistance?: number;
    difficulty?: string;
    gamemode?: string;
    onlineMode?: boolean;
    whitelist?: boolean;
    idleTimeoutSec?: number;
  },
) {
  const { server, session } = await loadServer(serverId);
  await prisma.server.update({ where: { id: server.id }, data: patch });
  await prisma.auditEvent.create({
    data: {
      serverId: server.id,
      userId: session.user.id,
      kind: "settings.update",
      payloadJson: JSON.stringify(patch),
    },
  });
  revalidatePath(`/servers/${serverId}`);
}
