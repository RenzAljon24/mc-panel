"use client";

import { useState, type FormEvent } from "react";
import { BellIcon, CheckIcon } from "lucide-react";

export function NotifyForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email");
      return;
    }
    // No backend yet — stash locally so user gets feedback.
    try {
      const KEY = "shop:notifyEmails";
      const list: string[] = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      if (!list.includes(value)) list.push(value);
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // ignore — storage may be disabled
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-2 border border-[#4ade80]/30 bg-[#4ade80]/5 px-4 py-2 font-mono text-xs text-[#4ade80]">
        <CheckIcon className="h-3.5 w-3.5" />
        you're on the list — we'll ping {email}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm items-stretch border border-[#2a2a2a] bg-[#0f0f0f] focus-within:border-[#4ade80]/60 transition-colors"
    >
      <span className="flex items-center pl-3 text-[#666]">
        <BellIcon className="h-3.5 w-3.5" />
      </span>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        placeholder="email@domain.gg"
        aria-label="Email for launch notification"
        aria-invalid={error ? "true" : undefined}
        className="flex-1 bg-transparent px-2.5 py-2 font-mono text-xs text-[#e8e8e8] placeholder:text-[#444] focus:outline-none"
      />
      <button
        type="submit"
        className="border-l border-[#2a2a2a] bg-[#4ade80]/10 px-3 font-mono text-[10px] uppercase tracking-widest text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors"
      >
        notify me
      </button>
      {error && (
        <span
          role="alert"
          className="absolute mt-10 font-mono text-[10px] uppercase tracking-widest text-red-400"
        >
          {error}
        </span>
      )}
    </form>
  );
}
