import { open, stat } from "node:fs/promises";
import path from "node:path";
import { MOCK_INFRA } from "./mock";
import { serverRoot } from "./files";

const READ_CHUNK = 64 * 1024;
const MAX_BYTES = 2 * 1024 * 1024;

const mockLines: Record<string, string[]> = {};

function seed(serverId: string): string[] {
  if (mockLines[serverId]) return mockLines[serverId];
  const now = Date.now();
  const base = [
    "[INFO]: Starting minecraft server version 1.21.4",
    "[INFO]: Loading properties",
    "[INFO]: Default game type: SURVIVAL",
    "[INFO]: Generating keypair",
    "[INFO]: Starting Minecraft server on *:25566",
    "[INFO]: Using epoll channel type",
    "[INFO]: Preparing level \"world\"",
    "[INFO]: Preparing start region for dimension minecraft:overworld",
    "[Geyser-Spigot]: Loading Geyser",
    "[Geyser-Spigot]: Started Geyser on 0.0.0.0:19132",
    "[floodgate]: Floodgate player linking is enabled",
    "[INFO]: Done (8.213s)! For help, type \"help\"",
    "[INFO]: Steve joined the game",
    "[INFO]: .BedrockSteve joined the game",
    "[INFO]: <Steve> hello cross-play",
  ];
  mockLines[serverId] = base.map((line, i) => {
    const ts = new Date(now - (base.length - i) * 4000);
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");
    const ss = String(ts.getSeconds()).padStart(2, "0");
    return `[${hh}:${mm}:${ss}] ${line}`;
  });
  return mockLines[serverId];
}

export async function tailLog(serverId: string, lines = 200): Promise<string[]> {
  if (MOCK_INFRA) {
    const all = seed(serverId);
    return all.slice(-lines);
  }
  const file = path.join(serverRoot(serverId), "logs", "latest.log");
  try {
    return await tailFile(file, lines);
  } catch {
    return [];
  }
}

async function tailFile(file: string, lines: number): Promise<string[]> {
  const info = await stat(file);
  const size = info.size;
  if (size === 0) return [];

  const handle = await open(file, "r");
  try {
    const collected: string[] = [];
    let pos = size;
    let carry = "";
    let bytesRead = 0;

    while (pos > 0 && collected.length <= lines && bytesRead < MAX_BYTES) {
      const chunkSize = Math.min(READ_CHUNK, pos);
      pos -= chunkSize;
      const buf = Buffer.alloc(chunkSize);
      await handle.read(buf, 0, chunkSize, pos);
      bytesRead += chunkSize;

      const text = buf.toString("utf8") + carry;
      const parts = text.split(/\r?\n/);
      carry = pos > 0 ? (parts.shift() ?? "") : "";

      for (let i = parts.length - 1; i >= 0; i--) {
        const line = parts[i];
        if (line.length === 0) continue;
        collected.push(line);
        if (collected.length >= lines) break;
      }
    }

    if (carry && collected.length < lines) collected.push(carry);
    return collected.reverse();
  } finally {
    await handle.close();
  }
}

export function appendMockLine(serverId: string, line: string): void {
  if (!MOCK_INFRA) return;
  const ts = new Date();
  const hh = String(ts.getHours()).padStart(2, "0");
  const mm = String(ts.getMinutes()).padStart(2, "0");
  const ss = String(ts.getSeconds()).padStart(2, "0");
  const arr = seed(serverId);
  arr.push(`[${hh}:${mm}:${ss}] ${line}`);
  if (arr.length > 500) arr.splice(0, arr.length - 500);
}
