"use client";

import { useEffect, useState } from "react";

export function MapFrame({ port }: { port: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(`${window.location.protocol}//${window.location.hostname}:${port}/`);
  }, [port]);

  if (!src) {
    return <div className="h-[calc(100vh-220px)] min-h-[480px] bg-background" />;
  }

  return (
    <iframe
      src={src}
      title="Dynmap"
      className="w-full h-[calc(100vh-220px)] min-h-[480px] border-0 bg-background"
    />
  );
}
