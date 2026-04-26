"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Map as MapIcon } from "lucide-react";

export function MapFrame({ port }: { port: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_DYNMAP_URL;
    if (envUrl && envUrl.trim()) {
      setSrc(envUrl);
      return;
    }
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
    const host = window.location.hostname;
    if (baseDomain && (host === baseDomain || host.endsWith(`.${baseDomain}`))) {
      setSrc(`https://map.${baseDomain}/`);
      return;
    }
    setSrc(`${window.location.protocol}//${host}:${port}/`);
  }, [port]);

  if (!src) {
    return (
      <div className="h-[60vh] min-h-[420px] flex items-center justify-center bg-background">
        <p className="font-mono text-xs text-muted-foreground">Loading map…</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="h-[60vh] min-h-[420px] flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <MapIcon className="h-8 w-8 text-muted-foreground" />
        <p className="font-mono text-sm text-foreground">Map failed to load.</p>
        <p className="font-mono text-xs text-muted-foreground wrap-break-word max-w-md">
          Tried {src}. Check that Dynmap is running and NEXT_PUBLIC_DYNMAP_URL points to it.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-xs font-mono hover:bg-accent"
        >
          Open in new tab <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <iframe
        src={src}
        title="Dynmap"
        onError={() => setFailed(true)}
        className="w-full h-[60vh] min-h-[420px] sm:h-[calc(100vh-260px)] border-0 bg-background"
        allowFullScreen
      />
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="absolute top-2 right-2 inline-flex items-center gap-1 border border-border bg-card/90 backdrop-blur px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground"
      >
        Full view <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
