"use client";

import { useEffect, useState } from "react";

const DYNMAP_PORT = Number(process.env.NEXT_PUBLIC_DYNMAP_PORT ?? 8123);

export function PublicMapFrame() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(
      `${window.location.protocol}//${window.location.hostname}:${DYNMAP_PORT}/`
    );
  }, []);

  if (!src) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090909]">
        <p className="font-mono text-xs text-[#444]">Loading map…</p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="Live Dynmap"
      className="flex-1 w-full border-0 bg-[#090909]"
      style={{ minHeight: 0 }}
      allowFullScreen
    />
  );
}
