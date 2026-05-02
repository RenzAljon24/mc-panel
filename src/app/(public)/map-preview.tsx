"use client";

import { useEffect, useState } from "react";

const DYNMAP_URL =
  process.env.NEXT_PUBLIC_DYNMAP_URL ?? "https://map.corecraft.site";

export function MapPreview() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(DYNMAP_URL);
  }, []);

  if (!src) {
    return (
      <div className="w-full h-[28rem] bg-[#0a0a0a] flex items-center justify-center">
        <span className="font-mono text-xs text-[#444]">Loading map…</span>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="Live Dynmap preview"
      className="w-full h-[28rem] border-0 bg-[#0a0a0a]"
      loading="lazy"
    />
  );
}