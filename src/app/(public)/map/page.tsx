import type { Metadata } from "next";
import { PublicMapFrame } from "./public-map-frame";

export const metadata: Metadata = {
  title: "Live Map",
  description: "Real-time world map",
};

export default function PublicMapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Minimal chrome */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#090909] shrink-0">
        <p className="font-mono text-xs text-[#555] uppercase tracking-widest">
          Live World Map
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#444]">
          <span className="size-1.5 rounded-full bg-[#4ade80] animate-pulse" />
          Craftverse
        </span>
      </div>
      <PublicMapFrame />
    </div>
  );
}
