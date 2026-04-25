"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, Pause, Play } from "lucide-react";

type LogLevel = "info" | "warn" | "error" | "debug" | "chat" | "raw";

const LEVEL_PATTERNS: Array<[RegExp, LogLevel]> = [
  [/\b(ERROR|SEVERE|FATAL)\b/i, "error"],
  [/\b(WARN|WARNING)\b/i, "warn"],
  [/\b(DEBUG|TRACE)\b/i, "debug"],
  [/\bINFO\b.*<.+>/, "chat"],
  [/\bINFO\b/i, "info"],
];

function classify(line: string): LogLevel {
  for (const [re, lvl] of LEVEL_PATTERNS) {
    if (re.test(line)) return lvl;
  }
  return "raw";
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-[#a8b3cf]",
  warn: "text-[#fcd34d]",
  error: "text-[#f87171]",
  debug: "text-[#7dd3fc]",
  chat: "text-[#86efac]",
  raw: "text-[#a8b3cf]",
};

export function ConsoleView({
  initialLines,
  autoScroll: defaultAutoScroll = true,
}: {
  initialLines: string[];
  autoScroll?: boolean;
}) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(defaultAutoScroll);
  const containerRef = useRef<HTMLDivElement>(null);

  // Polled refresh — RSC re-fetches lines via router.refresh()
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [paused, router]);

  const items = useMemo(
    () => initialLines.map((l, i) => ({ id: i, level: classify(l), text: l })),
    [initialLines],
  );

  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [items, autoScroll]);

  function onScroll() {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (!nearBottom && autoScroll) setAutoScroll(false);
  }

  function jumpToBottom() {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    setAutoScroll(true);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider hover:bg-accent"
            aria-pressed={paused}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider hover:bg-accent"
          >
            Refresh
          </button>
          <span className="text-[11px] font-mono text-muted-foreground">
            {items.length} line{items.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={jumpToBottom}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider hover:bg-accent"
          >
            <ArrowDown className="h-3 w-3" />
            Tail
          </button>
        </div>
      </div>

      {/* Output */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="relative h-[55vh] sm:h-[480px] overflow-auto border border-border bg-[#0b0d12] font-mono text-[12px] leading-relaxed"
      >
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No log output yet.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((it) => (
              <div
                key={it.id}
                className={`flex gap-3 px-3 py-1 hover:bg-white/[0.03] ${LEVEL_STYLES[it.level]}`}
              >
                <span className="select-none text-[10px] text-white/20 tabular-nums w-8 text-right shrink-0 mt-0.5">
                  {it.id + 1}
                </span>
                <span className="whitespace-pre-wrap break-all flex-1">{it.text}</span>
              </div>
            ))}
          </div>
        )}
        {!autoScroll && items.length > 0 && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 border border-border bg-background/95 px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider shadow"
          >
            <ArrowDown className="h-3 w-3" />
            New output
          </button>
        )}
      </div>
    </div>
  );
}
