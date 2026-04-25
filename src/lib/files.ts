import { readdir, readFile, writeFile, stat, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { MOCK_INFRA } from "./mock";

export type FileNode = {
  name: string;
  path: string;
  kind: "file" | "dir";
  sizeBytes?: number;
};

const MC_ROOT = process.env.MC_ROOT ?? "/srv/mc";

export function serverRoot(serverId: string): string {
  return path.join(MC_ROOT, serverId);
}

function resolveSafe(serverId: string, subpath: string): string {
  const root = serverRoot(serverId);
  const cleaned = subpath.replace(/^\/+/, "").replace(/\\/g, "/");
  const resolved = path.resolve(root, cleaned);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Path escapes server root");
  }
  return resolved;
}

function mockFs(): Map<string, string | null> {
  const g = globalThis as unknown as { __mcMockFs?: Map<string, string | null> };
  if (!g.__mcMockFs) {
    g.__mcMockFs = new Map<string, string | null>([
      ["", null],
      ["plugins", null],
      ["world", null],
      ["world/region", null],
      ["logs", null],
      ["server.properties",
        "motd=A cross-play cracked server\nonline-mode=false\nenforce-secure-profile=false\nmax-players=20\nview-distance=10\ndifficulty=normal\n",
      ],
      ["eula.txt", "eula=true\n"],
      ["ops.json", "[]\n"],
      ["whitelist.json", "[]\n"],
      ["plugins/Geyser-Spigot.jar", "<binary 8.4 MB>"],
      ["plugins/floodgate-spigot.jar", "<binary 2.1 MB>"],
      ["plugins/config.yml", "floodgate:\n  username-prefix: '.'\n  replace-spaces: true\n"],
      ["world/level.dat", "<binary 12 KB>"],
      ["logs/latest.log", "see Console tab\n"],
    ]);
  }
  return g.__mcMockFs;
}

export async function listDir(serverId: string, subpath: string): Promise<FileNode[]> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (MOCK_INFRA) {
    const fs = mockFs();
    const prefix = normalized === "" ? "" : `${normalized}/`;
    const seen = new Map<string, FileNode>();
    for (const [p, v] of fs.entries()) {
      if (!p.startsWith(prefix) || p === normalized) continue;
      const rest = p.slice(prefix.length);
      const slash = rest.indexOf("/");
      if (slash === -1) {
        const full = prefix + rest;
        const kind: "file" | "dir" = v === null ? "dir" : "file";
        seen.set(rest, {
          name: rest,
          path: full,
          kind,
          sizeBytes: kind === "file" ? (v as string).length : undefined,
        });
      } else {
        const name = rest.slice(0, slash);
        if (!seen.has(name)) {
          seen.set(name, { name, path: prefix + name, kind: "dir" });
        }
      }
    }
    return [...seen.values()].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  const target = resolveSafe(serverId, normalized);
  const entries = await readdir(target, { withFileTypes: true });
  const out: FileNode[] = [];
  for (const e of entries) {
    const rel = normalized ? `${normalized}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push({ name: e.name, path: rel, kind: "dir" });
    } else if (e.isFile()) {
      const full = path.join(target, e.name);
      const s = await stat(full).catch(() => null);
      out.push({ name: e.name, path: rel, kind: "file", sizeBytes: s?.size });
    }
  }
  return out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getNodeKind(
  serverId: string,
  subpath: string,
): Promise<"file" | "dir" | "missing"> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (MOCK_INFRA) {
    const fs = mockFs();
    if (normalized === "") return "dir";
    if (fs.has(normalized)) {
      return fs.get(normalized) === null ? "dir" : "file";
    }
    for (const key of fs.keys()) {
      if (key.startsWith(`${normalized}/`)) return "dir";
    }
    return "missing";
  }
  const target = resolveSafe(serverId, normalized);
  const s = await stat(target).catch(() => null);
  if (!s) return "missing";
  return s.isDirectory() ? "dir" : "file";
}

export async function readTextFile(
  serverId: string,
  subpath: string,
): Promise<{ content: string; binary: boolean }> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (MOCK_INFRA) {
    const v = mockFs().get(normalized);
    if (v == null) throw new Error("File not found");
    const binary = v.startsWith("<binary");
    return { content: v, binary };
  }
  const target = resolveSafe(serverId, normalized);
  const buf = await readFile(target);
  const binary = buf.includes(0);
  return { content: binary ? `<binary ${buf.length} bytes>` : buf.toString("utf8"), binary };
}

export async function writeTextFile(
  serverId: string,
  subpath: string,
  content: string,
): Promise<void> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (MOCK_INFRA) {
    mockFs().set(normalized, content);
    return;
  }
  const target = resolveSafe(serverId, normalized);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

export async function writeBinaryFile(
  serverId: string,
  subpath: string,
  data: Uint8Array,
): Promise<void> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (!normalized) throw new Error("Empty path");
  if (MOCK_INFRA) {
    mockFs().set(normalized, `<binary ${data.byteLength} bytes>`);
    // ensure parent dirs exist as dir markers
    let acc = "";
    for (const seg of normalized.split("/").slice(0, -1)) {
      acc = acc ? `${acc}/${seg}` : seg;
      if (!mockFs().has(acc)) mockFs().set(acc, null);
    }
    return;
  }
  const target = resolveSafe(serverId, normalized);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function makeDir(serverId: string, subpath: string): Promise<void> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (!normalized) throw new Error("Empty path");
  if (MOCK_INFRA) {
    const fs = mockFs();
    if (fs.has(normalized) && fs.get(normalized) !== null) {
      throw new Error("A file with that name already exists");
    }
    let acc = "";
    for (const seg of normalized.split("/")) {
      acc = acc ? `${acc}/${seg}` : seg;
      if (!fs.has(acc)) fs.set(acc, null);
    }
    return;
  }
  const target = resolveSafe(serverId, normalized);
  await mkdir(target, { recursive: true });
}

export async function deleteNode(serverId: string, subpath: string): Promise<void> {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (!normalized) throw new Error("Refusing to delete server root");
  if (MOCK_INFRA) {
    const fs = mockFs();
    const prefix = `${normalized}/`;
    for (const key of [...fs.keys()]) {
      if (key === normalized || key.startsWith(prefix)) fs.delete(key);
    }
    return;
  }
  const target = resolveSafe(serverId, normalized);
  await rm(target, { recursive: true, force: true });
}

export function parentPath(subpath: string): string {
  const normalized = subpath.replace(/^\/+|\/+$/g, "");
  if (!normalized) return "";
  const i = normalized.lastIndexOf("/");
  return i === -1 ? "" : normalized.slice(0, i);
}
