"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { startServer, stopServer, restartServer } from "../actions";

export function PowerButtons({ serverId, status }: { serverId: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

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
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={pending || status === "up" || status === "starting"}
        onClick={() => run("Start", () => startServer(serverId))}
      >
        Start
      </Button>
      <Button
        variant="destructive"
        disabled={pending || status === "idle"}
        onClick={() => run("Stop", () => stopServer(serverId))}
      >
        Stop
      </Button>
      <Button
        variant="outline"
        disabled={pending || status === "idle"}
        onClick={() => run("Restart", () => restartServer(serverId))}
      >
        Restart
      </Button>
    </div>
  );
}
