"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Send } from "lucide-react";
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
    <form onSubmit={submit} className="space-y-2">
      <div
        className={`flex items-stretch border border-border bg-[#0b0d12] focus-within:border-foreground transition-colors ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <span className="flex items-center pl-3 pr-1 text-[#86efac]">
          <ChevronRight className="h-4 w-4" />
        </span>
        <input
          value={cmd}
          placeholder={
            disabled
              ? "Server offline — start it to send commands"
              : "say hello · list · whitelist add Steve  (↑/↓ history)"
          }
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled || pending}
          className="flex-1 min-w-0 bg-transparent px-1 py-2.5 font-mono text-sm text-[#a8b3cf] placeholder:text-white/20 focus:outline-none disabled:cursor-not-allowed"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={disabled || pending || !cmd.trim()}
          aria-label="Send command"
          className="flex items-center gap-1.5 border-l border-border px-3 sm:px-4 text-xs font-mono uppercase tracking-wider text-foreground hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{pending ? "…" : "Send"}</span>
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground font-mono">
        Tip: use ↑ / ↓ to scroll through recent commands.
      </p>
    </form>
  );
}
