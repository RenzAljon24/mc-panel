import { execFile } from "node:child_process";
import { createConnection } from "node:net";
import { promisify } from "node:util";
import { MOCK_INFRA } from "./mock";

const pExecFile = promisify(execFile);

export type ServerStatus = "idle" | "starting" | "up" | "stopping" | "error";

const mockStatuses = new Map<string, ServerStatus>();

const PAPER_HOST = process.env.PAPER_HOST ?? "127.0.0.1";
const PAPER_PORT = Number(process.env.PAPER_PORT ?? 25565);

function unitName(): string {
  return "paper@demo.service";
}

export async function start(_serverId: string): Promise<void> {
  if (MOCK_INFRA) {
    mockStatuses.set("demo", "starting");
    setTimeout(() => mockStatuses.set("demo", "up"), 2000);
    return;
  }
  await pExecFile("sudo", ["systemctl", "start", unitName()]);
}

export async function stop(_serverId: string): Promise<void> {
  if (MOCK_INFRA) {
    mockStatuses.set("demo", "stopping");
    setTimeout(() => mockStatuses.set("demo", "idle"), 2000);
    return;
  }
  await pExecFile("sudo", ["systemctl", "stop", unitName()]);
}

export async function restart(_serverId: string): Promise<void> {
  if (MOCK_INFRA) {
    mockStatuses.set("demo", "starting");
    setTimeout(() => mockStatuses.set("demo", "up"), 3000);
    return;
  }
  await pExecFile("sudo", ["systemctl", "restart", unitName()]);
}

function probePort(host: string, port: number, timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.setTimeout(timeoutMs, () => done(false));
  });
}

export async function getStatus(_serverId: string): Promise<ServerStatus> {
  if (MOCK_INFRA) {
    return mockStatuses.get("demo") ?? "idle";
  }

  let unitState = "inactive";
  try {
    const { stdout } = await pExecFile("sudo", [
      "systemctl",
      "is-active",
      unitName(),
    ]);
    unitState = stdout.trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string };
    unitState = e.stdout?.trim() ?? "inactive";
  }

  if (unitState === "failed") return "error";
  if (unitState === "activating") return "starting";
  if (unitState === "deactivating") return "stopping";
  if (unitState !== "active") return "idle";

  const paperAlive = await probePort(PAPER_HOST, PAPER_PORT);
  return paperAlive ? "up" : "starting";
}