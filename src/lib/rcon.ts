import { Rcon } from "rcon-client";
import { MOCK_INFRA } from "./mock";

export type RconTarget = {
  host: string;
  port: number;
  password: string;
};

type MockState = {
  players: Set<string>;
  ops: Set<string>;
  whitelist: Set<string>;
  banned: Set<string>;
};

function state(): MockState {
  const g = globalThis as unknown as { __mcMockRcon?: MockState };
  if (!g.__mcMockRcon) {
    g.__mcMockRcon = {
      players: new Set(["Steve", "Alex", ".BedrockSteve"]),
      ops: new Set(["Steve"]),
      whitelist: new Set(["Steve", "Alex", ".BedrockSteve"]),
      banned: new Set(),
    };
  }
  return g.__mcMockRcon;
}

export function mockRoster() {
  const s = state();
  return {
    players: [...s.players],
    ops: [...s.ops],
    whitelist: [...s.whitelist],
    banned: [...s.banned],
  };
}

export async function runCommand(target: RconTarget, cmd: string): Promise<string> {
  if (MOCK_INFRA) {
    return mockRcon(cmd);
  }
  const client = await Rcon.connect(target);
  try {
    return await client.send(cmd);
  } finally {
    await client.end();
  }
}

export async function listPlayers(target: RconTarget): Promise<string[]> {
  const raw = await runCommand(target, "list");
  const stripped = raw.replace(/§./g, "");
  const idx = stripped.toLowerCase().indexOf("players online:");
  if (idx === -1) return [];
  const tail = stripped.slice(idx + "players online:".length);
  return tail
    .split(/[,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function broadcast(target: RconTarget, message: string): Promise<void> {
  await runCommand(target, `say ${message}`);
}

function firstArg(cmd: string, prefix: string): string {
  return cmd.slice(prefix.length).trim().split(/\s+/)[0] ?? "";
}

function mockRcon(cmd: string): string {
  const s = state();
  if (cmd === "list") {
    const arr = [...s.players];
    return `There are ${arr.length} of 20 players online: ${arr.join(", ")}`;
  }
  if (cmd.startsWith("say ")) return "";
  if (cmd === "stop") return "Stopping the server";
  if (cmd.startsWith("kick ")) {
    const p = firstArg(cmd, "kick ");
    s.players.delete(p);
    return `Kicked ${p}`;
  }
  if (cmd.startsWith("ban ")) {
    const p = firstArg(cmd, "ban ");
    s.banned.add(p);
    s.players.delete(p);
    return `Banned ${p}`;
  }
  if (cmd.startsWith("pardon ")) {
    const p = firstArg(cmd, "pardon ");
    s.banned.delete(p);
    return `Unbanned ${p}`;
  }
  if (cmd.startsWith("op ")) {
    const p = firstArg(cmd, "op ");
    s.ops.add(p);
    return `Made ${p} a server operator`;
  }
  if (cmd.startsWith("deop ")) {
    const p = firstArg(cmd, "deop ");
    s.ops.delete(p);
    return `Removed ${p} from operators`;
  }
  if (cmd.startsWith("whitelist add ")) {
    const p = firstArg(cmd, "whitelist add ");
    s.whitelist.add(p);
    return `Added ${p} to the whitelist`;
  }
  if (cmd.startsWith("whitelist remove ")) {
    const p = firstArg(cmd, "whitelist remove ");
    s.whitelist.delete(p);
    return `Removed ${p} from the whitelist`;
  }
  if (cmd === "whitelist list") {
    return `There are ${s.whitelist.size} whitelisted players: ${[...s.whitelist].join(", ")}`;
  }
  return `[mock] ${cmd}`;
}
