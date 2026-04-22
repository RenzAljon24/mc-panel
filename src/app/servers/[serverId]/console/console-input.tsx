"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendConsoleCommand } from "../actions";

export function ConsoleInput({ serverId, disabled }: { serverId: string; disabled: boolean }) {
  const [cmd, setCmd] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = cmd.trim();
    if (!value) return;
    start(async () => {
      try {
        const out = await sendConsoleCommand(serverId, value);
        setHistory((h) => [value, ...h].slice(0, 50));
        setCursor(-1);
        setCmd("");
        if (out) toast.success(out.slice(0, 160));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Command failed");
      }
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      if (next >= 0) {
        setCursor(next);
        setCmd(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setCmd(next < 0 ? "" : history[next]);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="minecraft-block text-xs font-black text-foreground uppercase tracking-widest">
        Command Input
      </p>
      <div className="flex gap-2">
        <input
          value={cmd}
          placeholder="e.g. say hello · list · whitelist add Steve"
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled || pending}
          className="flex-1 border-2 border-border bg-[#0a0a0a] px-4 py-2 font-mono text-sm text-foreground placeholder-muted-foreground disabled:opacity-50 focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={disabled || pending || !cmd.trim()}
          className="minecraft-block px-6 py-2 border-2 border-border bg-primary text-primary-foreground uppercase text-xs font-black disabled:opacity-50"
        >
          {pending ? "..." : "SEND"}
        </button>
      </div>
    </form>
  );
}
