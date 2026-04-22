"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IpCopyButtonProps {
  ip: string;
  label?: string;
  className?: string;
  variant?: "hero" | "compact";
}

export function IpCopyButton({
  ip,
  label,
  className,
  variant = "compact",
}: IpCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      toast.success("Server IP copied!", { description: ip });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — please copy manually", { description: ip });
    }
  }

  if (variant === "hero") {
    return (
      <button
        onClick={handleCopy}
        aria-label={`Copy server IP: ${ip}`}
        className={cn(
          "group flex items-center gap-3 border border-[#2a2a2a] bg-[#111] px-5 py-3 font-mono text-sm",
          "hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]",
          className
        )}
      >
        <span className="text-[#4ade80] font-bold">{ip}</span>
        <span className="text-[#444] text-xs">click to copy</span>
        <span className="ml-1 text-[#555] group-hover:text-[#4ade80] transition-colors">
          {copied ? (
            <CheckIcon className="size-4 text-[#4ade80]" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={`Copy ${label ?? "IP"}: ${ip}`}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-mono border border-[#2a2a2a] bg-[#0d0d0d]",
        "hover:border-[#4ade80]/50 hover:bg-[#4ade80]/5 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80]",
        className
      )}
    >
      <span className="text-[#ccc]">{ip}</span>
      {copied ? (
        <CheckIcon className="size-3 text-[#4ade80]" />
      ) : (
        <CopyIcon className="size-3 text-[#555]" />
      )}
    </button>
  );
}
