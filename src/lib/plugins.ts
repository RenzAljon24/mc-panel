import { createHash } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";
import { serverRoot } from "./files";
import { getProjectVersions, type ModrinthVersion } from "./modrinth";
import { MOCK_INFRA } from "./mock";

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

function pickVersion(versions: ModrinthVersion[], mcVersion: string): ModrinthVersion | null {
  const compatible = versions.filter((v) => v.game_versions.includes(mcVersion));
  return compatible[0] ?? versions[0] ?? null;
}

function safeFilename(name: string): string {
  const base = path.basename(name);
  if (!/^[A-Za-z0-9._-]+\.jar$/.test(base)) {
    throw new Error(`Unsafe plugin filename: ${name}`);
  }
  return base;
}

export async function installPluginFromModrinth(
  serverId: string,
  slug: string,
): Promise<{ name: string; version: string; filename: string }> {
  if (!SLUG_RE.test(slug)) throw new Error("Invalid plugin slug");

  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error("Server not found");

  const versions = await getProjectVersions(slug, server.jarVersion);
  const version = pickVersion(versions, server.jarVersion);
  if (!version) throw new Error(`No compatible version for Minecraft ${server.jarVersion}`);

  const file = version.files.find((f) => f.primary) ?? version.files[0];
  if (!file) throw new Error("Modrinth version has no downloadable file");

  const filename = safeFilename(file.filename);
  const pluginsDir = path.join(serverRoot(server.id), "plugins");
  const targetPath = path.join(pluginsDir, filename);

  if (!MOCK_INFRA) {
    await mkdir(pluginsDir, { recursive: true });
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const gotHash = createHash("sha512").update(buf).digest("hex");
    if (gotHash !== file.hashes.sha512) {
      throw new Error("SHA-512 mismatch — aborting install");
    }

    await writeFile(targetPath, buf);
  }

  await prisma.$transaction([
    prisma.plugin.upsert({
      where: { serverId_slug: { serverId: server.id, slug } },
      create: {
        serverId: server.id,
        slug,
        name: slug,
        source: "modrinth",
        version: version.version_number,
        filename,
        enabled: true,
      },
      update: {
        version: version.version_number,
        filename,
        enabled: true,
      },
    }),
    prisma.server.update({
      where: { id: server.id },
      data: { restartRequired: true },
    }),
  ]);

  return { name: slug, version: version.version_number, filename };
}

export async function uninstallPlugin(serverId: string, pluginId: string): Promise<void> {
  const plugin = await prisma.plugin.findFirst({
    where: { id: pluginId, serverId },
  });
  if (!plugin) throw new Error("Plugin not found");

  if (!MOCK_INFRA && plugin.filename) {
    const fname = safeFilename(plugin.filename);
    const target = path.join(serverRoot(serverId), "plugins", fname);
    await unlink(target).catch(() => {});
  }

  await prisma.$transaction([
    prisma.plugin.delete({ where: { id: plugin.id } }),
    prisma.server.update({
      where: { id: serverId },
      data: { restartRequired: true },
    }),
  ]);
}
