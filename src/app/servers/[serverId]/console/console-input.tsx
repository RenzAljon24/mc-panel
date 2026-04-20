"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={cmd}
        placeholder="e.g. say hello · list · whitelist add Steve"
        onChange={(e) => setCmd(e.target.value)}
        onKeyDown={onKey}
        disabled={disabled || pending}
        className="font-mono"
      />
      <Button type="submit" disabled={disabled || pending || !cmd.trim()}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
