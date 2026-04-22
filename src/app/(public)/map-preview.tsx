"use client";

import { useEffect, useState } from "react";

const DYNMAP_PORT = Number(process.env.NEXT_PUBLIC_DYNMAP_PORT ?? 8123);

export function MapPreview() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(
      `${window.location.protocol}//${window.location.hostname}:${DYNMAP_PORT}/`
    );
  }, []);

  if (!src) {
    return (
      <div className="w-full h-64 bg-[#0a0a0a] border border-[#1e1e1e] flex items-center justify-center">
        <span className="font-mono text-xs text-[#444]">Loading map…</span>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="Live Dynmap preview"
      className="w-full h-64 border-0 bg-[#0a0a0a]"
      loading="lazy"
    />
  );
}
