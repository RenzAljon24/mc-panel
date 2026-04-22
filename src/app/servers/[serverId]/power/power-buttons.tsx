"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startServer, stopServer, restartServer } from "../actions";

export function PowerButtons({ serverId, status }: { serverId: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isRunning = status === "up";
  const isStarting = status === "starting";
  const isStopping = status === "stopping";
  const isIdle = status === "idle";

  function run(label: string, fn: () => Promise<void>) {
    start(async () => {
      try {
        await fn();
        toast.success(`${label} requested`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `${label} failed`);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Start Button - Hidden when running or starting */}
      <div className={`transition-all duration-300 overflow-hidden ${isRunning || isStarting ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        <button
          disabled={pending || isRunning || isStarting}
          onClick={() => run("Start", () => startServer(serverId))}
          className="minecraft-block border-2 border-border bg-[#22cc22] text-[#000000] px-6 py-2 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#33dd33] transition-colors"
        >
          {pending && isIdle ? "..." : "Start"}
        </button>
      </div>

      {/* Running Status - Shown when running */}
      <div className={`transition-all duration-300 overflow-hidden ${isRunning ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
        <div className="minecraft-block border-2 border-[#22cc22] bg-[#001100] text-[#22cc22] px-6 py-2 text-xs font-black uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#22cc22] animate-pulse" />
          Running
        </div>
      </div>

      {/* Starting Status - Shown when starting */}
      <div className={`transition-all duration-300 overflow-hidden ${isStarting ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
        <div className="minecraft-block border-2 border-[#ffdd00] bg-[#1a1a00] text-[#ffdd00] px-6 py-2 text-xs font-black uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#ffdd00] animate-pulse" />
          Starting...
        </div>
      </div>

      {/* Stop Button - Hidden when idle or stopping */}
      <div className={`transition-all duration-300 overflow-hidden ${isIdle || isStopping ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        <button
          disabled={pending || isIdle || isStopping}
          onClick={() => run("Stop", () => stopServer(serverId))}
          className="minecraft-block border-2 border-border bg-[#ff3333] text-[#ffffff] px-6 py-2 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#ff5555] transition-colors"
        >
          Stop
        </button>
      </div>

      {/* Stopping Status - Shown when stopping */}
      <div className={`transition-all duration-300 overflow-hidden ${isStopping ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
        <div className="minecraft-block border-2 border-[#ff9900] bg-[#1a0a00] text-[#ff9900] px-6 py-2 text-xs font-black uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#ff9900] animate-pulse" />
          Stopping...
        </div>
      </div>

      {/* Restart Button - Hidden when idle or transitioning */}
      <div className={`transition-all duration-300 overflow-hidden ${isIdle || isStarting || isStopping ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        <button
          disabled={pending || isIdle || isStarting || isStopping}
          onClick={() => run("Restart", () => restartServer(serverId))}
          className="minecraft-block border-2 border-border bg-[#5544ff] text-[#ffffff] px-6 py-2 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#7766ff] transition-colors"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
