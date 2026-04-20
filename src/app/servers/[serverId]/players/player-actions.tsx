"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { runPlayerAction } from "../actions";

type Action = "kick" | "ban" | "pardon" | "op" | "deop" | "whitelist-add" | "whitelist-remove";

export function PlayerActions({
  serverId,
  player,
  isOp,
  context = "online",
}: {
  serverId: string;
  player: string;
  isOp: boolean;
  context?: "online" | "whitelist" | "banned";
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function go(action: Action) {
    start(async () => {
      try {
        const out = await runPlayerAction(serverId, player, action);
        toast.success(out || `${action} ${player}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `${action} failed`);
      }
    });
  }

  if (context === "banned") {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={() => go("pardon")}>
        Unban
      </Button>
    );
  }
  if (context === "whitelist") {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={() => go("whitelist-remove")}>
        Remove
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => go(isOp ? "deop" : "op")}>
        {isOp ? "Deop" : "Op"}
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => go("kick")}>
        Kick
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => go("ban")}>
        Ban
      </Button>
    </div>
  );
}

export function AddToList({
  serverId,
  kind,
}: {
  serverId: string;
  kind: "whitelist";
}) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    start(async () => {
      try {
        await runPlayerAction(serverId, trimmed, `${kind}-add` as Action);
        toast.success(`Added ${trimmed}`);
        setValue("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Add failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Player name"
        className="font-mono"
      />
      <Button type="submit" disabled={pending || !value.trim()}>
        Add
      </Button>
    </form>
  );
}
