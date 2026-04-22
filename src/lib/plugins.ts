import { createHash } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";
import { serverRoot } from "./files";
import { getProjectVersions as getModrinthVersions, type ModrinthVersion } from "./modrinth";
import {
  getProjectVersions as getHangarVersions,
  buildDownloadUrl as buildHangarDownloadUrl,
  type HangarVersion,
} from "./hangar";
import { MOCK_INFRA } from "./mock";

export type PluginSource = "modrinth" | "hangar" | "upload" | "url";

const MAX_PLUGIN_BYTES = 50 * 1024 * 1024; // 50 MB
const JAR_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // "PK\x03\x04"

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

function pickModrinth(versions: ModrinthVersion[], mcVersion: string): ModrinthVersion | null {
  const compatible = versions.filter((v) => v.game_versions.includes(mcVersion));
  return compatible[0] ?? versions[0] ?? null;
}

function pickHangar(versions: HangarVersion[], mcVersion: string): HangarVersion | null {
  const compatible = versions.filter((v) => v.platformDependencies.PAPER?.includes(mcVersion));
  return compatible[0] ?? versions[0] ?? null;
}

function safeFilename(name: string): string {
  const base = path.basename(name);
  if (!/^[A-Za-z0-9._-]+\.jar$/.test(base)) {
    throw new Error(`Unsafe plugin filename: ${name}`);
  }
  return base;
}

async function downloadAndVerify(
  url: string,
  hashAlgo: "sha512" | "sha256",
  expectedHash: string | null,
): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (expectedHash) {
    const got = createHash(hashAlgo).update(buf).digest("hex");
    if (got !== expectedHash) {
      throw new Error(`${hashAlgo.toUpperCase()} mismatch — aborting install`);
    }
  }
  return buf;
}

async function recordInstall(args: {
  serverId: string;
  source: PluginSource;
  slug: string;
  name: string;
  version: string;
  filename: string;
}) {
  await prisma.$transaction([
    prisma.plugin.upsert({
      where: {
        serverId_source_slug: {
          serverId: args.serverId,
          source: args.source,
          slug: args.slug,
        },
      },
      create: {
        serverId: args.serverId,
        slug: args.slug,
        name: args.name,
        source: args.source,
        version: args.version,
        filename: args.filename,
        enabled: true,
      },
      update: {
        version: args.version,
        filename: args.filename,
        enabled: true,
      },
    }),
    prisma.server.update({
      where: { id: args.serverId },
      data: { restartRequired: true },
    }),
  ]);
}

export async function installPluginFromModrinth(
  serverId: string,
  slug: string,
): Promise<{ name: string; version: string; filename: string }> {
  if (!SLUG_RE.test(slug)) throw new Error("Invalid plugin slug");

  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error("Server not found");

  const versions = await getModrinthVersions(slug, server.jarVersion);
  const version = pickModrinth(versions, server.jarVersion);
  if (!version) throw new Error(`No compatible version for Minecraft ${server.jarVersion}`);

  const file = version.files.find((f) => f.primary) ?? version.files[0];
  if (!file) throw new Error("Modrinth version has no downloadable file");

  const filename = safeFilename(file.filename);
  const pluginsDir = path.join(serverRoot(server.id), "plugins");
  const targetPath = path.join(pluginsDir, filename);

  if (!MOCK_INFRA) {
    await mkdir(pluginsDir, { recursive: true });
    const buf = await downloadAndVerify(file.url, "sha512", file.hashes.sha512);
    await writeFile(targetPath, buf);
  }

  await recordInstall({
    serverId: server.id,
    source: "modrinth",
    slug,
    name: slug,
    version: version.version_number,
    filename,
  });

  return { name: slug, version: version.version_number, filename };
}

export async function installPluginFromHangar(
  serverId: string,
  slug: string,
): Promise<{ name: string; version: string; filename: string }> {
  if (!SLUG_RE.test(slug)) throw new Error("Invalid plugin slug");

  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error("Server not found");

  const versions = await getHangarVersions(slug, server.jarVersion);
  const version = pickHangar(versions, server.jarVersion);
  if (!version) throw new Error(`No compatible version for Minecraft ${server.jarVersion}`);

  const paper = version.downloads.PAPER;
  if (!paper) throw new Error("Hangar version has no Paper download");
  if (paper.externalUrl) {
    throw new Error("Plugin is hosted externally — install manually for now");
  }
  if (!paper.fileInfo) throw new Error("Hangar version is missing file info");

  const filename = safeFilename(paper.fileInfo.name);
  const downloadUrl = buildHangarDownloadUrl(slug, version.name);
  const pluginsDir = path.join(serverRoot(server.id), "plugins");
  const targetPath = path.join(pluginsDir, filename);

  if (!MOCK_INFRA) {
    await mkdir(pluginsDir, { recursive: true });
    const buf = await downloadAndVerify(downloadUrl, "sha256", paper.fileInfo.sha256Hash);
    await writeFile(targetPath, buf);
  }

  await recordInstall({
    serverId: server.id,
    source: "hangar",
    slug,
    name: slug,
    version: version.name,
    filename,
  });

  return { name: slug, version: version.name, filename };
}

function sanitizeJarFilename(raw: string): string {
  const base = path.basename(raw).replace(/\s+/g, "_");
  if (!/\.jar$/i.test(base)) throw new Error("Filename must end in .jar");
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "");
  if (!/^[A-Za-z0-9._-]+\.jar$/.test(cleaned)) {
    throw new Error("Unsafe plugin filename");
  }
  return cleaned;
}

function slugFromFilename(filename: string): string {
  const stem = filename.replace(/\.jar$/i, "");
  const slug = stem.toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 64);
  if (!/^[a-z0-9]/.test(slug)) return `upload-${slug}`.slice(0, 64);
  return slug;
}

function assertSafeUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("URL must be http(s)");
  }
  const host = u.hostname.toLowerCase();
  const blocked = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc/,
    /^fd/,
    /^fe80:/,
  ];
  if (blocked.some((r) => r.test(host))) {
    throw new Error("URL host is not allowed");
  }
  return u;
}

export async function installPluginFromUpload(
  serverId: string,
  rawFilename: string,
  buf: Buffer,
): Promise<{ name: string; version: string; filename: string }> {
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error("Server not found");

  if (buf.length === 0) throw new Error("Empty file");
  if (buf.length > MAX_PLUGIN_BYTES) throw new Error("File exceeds 50 MB limit");
  if (!buf.subarray(0, 4).equals(JAR_MAGIC)) {
    throw new Error("Not a valid JAR file (bad magic bytes)");
  }

  const filename = sanitizeJarFilename(rawFilename);
  const slug = slugFromFilename(filename);
  const pluginsDir = path.join(serverRoot(server.id), "plugins");
  const targetPath = path.join(pluginsDir, filename);

  if (!MOCK_INFRA) {
    await mkdir(pluginsDir, { recursive: true });
    await writeFile(targetPath, buf);
  }

  await recordInstall({
    serverId: server.id,
    source: "upload",
    slug,
    name: slug,
    version: "manual",
    filename,
  });

  return { name: slug, version: "manual", filename };
}

export async function installPluginFromUrl(
  serverId: string,
  rawUrl: string,
): Promise<{ name: string; version: string; filename: string }> {
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error("Server not found");

  const url = assertSafeUrl(rawUrl);
  const urlPathBase = path.basename(url.pathname);
  if (!/\.jar$/i.test(urlPathBase)) {
    throw new Error("URL must point to a .jar file");
  }
  const filename = sanitizeJarFilename(urlPathBase);
  const slug = slugFromFilename(filename);

  const pluginsDir = path.join(serverRoot(server.id), "plugins");
  const targetPath = path.join(pluginsDir, filename);

  if (!MOCK_INFRA) {
    await mkdir(pluginsDir, { recursive: true });
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len && len > MAX_PLUGIN_BYTES) throw new Error("File exceeds 50 MB limit");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PLUGIN_BYTES) throw new Error("File exceeds 50 MB limit");
    if (!buf.subarray(0, 4).equals(JAR_MAGIC)) {
      throw new Error("Downloaded file is not a valid JAR");
    }
    await writeFile(targetPath, buf);
  }

  await recordInstall({
    serverId: server.id,
    source: "url",
    slug,
    name: slug,
    version: "manual",
    filename,
  });

  return { name: slug, version: "manual", filename };
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
