"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
      <button
        disabled={pending}
        onClick={() => go("pardon")}
        className="minecraft-block border-2 border-border bg-[#22cc22] text-[#000000] px-3 py-1 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#33dd33] transition-colors"
      >
        {pending ? "..." : "Pardon"}
      </button>
    );
  }
  if (context === "whitelist") {
    return (
      <button
        disabled={pending}
        onClick={() => go("whitelist-remove")}
        className="minecraft-block border-2 border-border bg-[#ff9900] text-[#ffffff] px-3 py-1 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#ffaa11] transition-colors"
      >
        {pending ? "..." : "Remove"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button
        disabled={pending}
        onClick={() => go(isOp ? "deop" : "op")}
        className="minecraft-block border-2 border-border bg-[#5544ff] text-[#ffffff] px-3 py-1 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#7766ff] transition-colors"
      >
        {isOp ? "Deop" : "Op"}
      </button>
      <button
        disabled={pending}
        onClick={() => go("kick")}
        className="minecraft-block border-2 border-border bg-[#ffaa00] text-[#ffffff] px-3 py-1 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#ffbb11] transition-colors"
      >
        {pending ? "..." : "Kick"}
      </button>
      <button
        disabled={pending}
        onClick={() => go("ban")}
        className="minecraft-block border-2 border-border bg-[#ff3333] text-[#ffffff] px-3 py-1 text-xs font-black uppercase disabled:opacity-50 hover:bg-[#ff5555] transition-colors"
      >
        {pending ? "..." : "Ban"}
      </button>
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
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Player name"
        className="flex-1 border-2 border-border bg-[#0a0a0a] px-4 py-2 font-mono text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="minecraft-block px-6 py-2 border-2 border-border bg-primary text-primary-foreground text-xs font-black uppercase disabled:opacity-50"
      >
        {pending ? "..." : "ADD"}
      </button>
    </form>
  );
}
