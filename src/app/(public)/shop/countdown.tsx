"use client";

import { useEffect, useState } from "react";

// Launch target: 30 days from first render on the client.
// Stable across re-renders within a session via sessionStorage.
function getTarget(): number {
  if (typeof window === "undefined") return Date.now() + 30 * 86_400_000;
  const KEY = "shop:launchTargetMs";
  const existing = window.sessionStorage.getItem(KEY);
  if (existing) {
    const n = Number(existing);
    if (Number.isFinite(n) && n > Date.now()) return n;
  }
  const next = Date.now() + 30 * 86_400_000;
  window.sessionStorage.setItem(KEY, String(next));
  return next;
}

function diff(targetMs: number) {
  const ms = Math.max(0, targetMs - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms / 3_600_000) % 24);
  const minutes = Math.floor((ms / 60_000) % 60);
  const seconds = Math.floor((ms / 1_000) % 60);
  return { days, hours, minutes, seconds };
}

export function ShopCountdown() {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<number>(0);
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tg = getTarget();
    setTarget(tg);
    setT(diff(tg));
    setMounted(true);
    const id = window.setInterval(() => setT(diff(tg)), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const cells: Array<{ label: string; value: number }> = [
    { label: "days", value: t.days },
    { label: "hours", value: t.hours },
    { label: "min", value: t.minutes },
    { label: "sec", value: t.seconds },
  ];

  return (
    <div className="mt-10">
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2 sm:gap-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden border border-[#1e1e1e] bg-gradient-to-b from-[#101010] to-[#070707] px-3 py-4 sm:py-5 text-center"
            aria-live="polite"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px bg-[#1a1a1a]"
            />
            <div
              className="relative font-mono text-3xl sm:text-5xl font-bold tabular-nums text-[#e8e8e8]"
              suppressHydrationWarning
            >
              {mounted ? String(c.value).padStart(2, "0") : "··"}
            </div>
            <div className="relative mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[#555]">
              {c.label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-[#444]">
        target launch ·{" "}
        <span suppressHydrationWarning>
          {mounted && target
            ? new Date(target).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "tba"}
        </span>
      </p>
    </div>
  );
}
