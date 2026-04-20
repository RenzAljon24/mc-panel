import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MOCK_INFRA } from "./mock";

const pExecFile = promisify(execFile);

export type ServerStatus = "idle" | "starting" | "up" | "stopping" | "error";

const mockStatuses = new Map<string, ServerStatus>();

export async function start(serverId: string): Promise<void> {
  if (MOCK_INFRA) {
    mockStatuses.set(serverId, "starting");
    setTimeout(() => mockStatuses.set(serverId, "up"), 2000);
    return;
  }
  await pExecFile("systemctl", ["start", `paper@${serverId}.service`]);
}

export async function stop(serverId: string): Promise<void> {
  if (MOCK_INFRA) {
    mockStatuses.set(serverId, "stopping");
    setTimeout(() => mockStatuses.set(serverId, "idle"), 2000);
    return;
  }
  await pExecFile("systemctl", ["stop", `paper@${serverId}.service`]);
}

export async function restart(serverId: string): Promise<void> {
  if (MOCK_INFRA) {
    mockStatuses.set(serverId, "starting");
    setTimeout(() => mockStatuses.set(serverId, "up"), 3000);
    return;
  }
  await pExecFile("systemctl", ["restart", `paper@${serverId}.service`]);
}

export async function getStatus(serverId: string): Promise<ServerStatus> {
  if (MOCK_INFRA) {
    return mockStatuses.get(serverId) ?? "idle";
  }
  try {
    const { stdout } = await pExecFile("systemctl", [
      "is-active",
      `paper@${serverId}.service`,
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
