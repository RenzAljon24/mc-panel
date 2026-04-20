import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MOCK_INFRA } from "./mock";

const pExecFile = promisify(execFile);

export type ServerStatus = "idle" | "starting" | "up" | "stopping" | "error";

const mockStatuses = new Map<string, ServerStatus>();

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

export async function getStatus(_serverId: string): Promise<ServerStatus> {
  if (MOCK_INFRA) {
    return mockStatuses.get("demo") ?? "idle";
  }

  try {
    const { stdout } = await pExecFile("sudo", [
      "systemctl",
      "is-active",
      unitName(),
    ]);

    const s = stdout.trim();
    if (s === "active") return "up";
    if (s === "activating") return "starting";
    if (s === "deactivating") return "stopping";
    if (s === "failed") return "error";
    return "idle";
  } catch {
    return "idle";
  }
}