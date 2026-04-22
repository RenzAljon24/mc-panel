"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { installPlugin, uninstallPlugin, restartServer } from "../actions";

export function InstallButton({ serverId, slug }: { serverId: string; slug: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const msg = await installPlugin(serverId, slug);
            toast.success(msg);
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Install failed");
          }
        })
      }
      className="border-2 border-border bg-foreground text-background px-3 py-1 text-xs font-mono font-black uppercase tracking-wide hover:bg-foreground/90 disabled:opacity-50"
    >
      {pending ? "..." : "Install"}
    </button>
  );
}

export function UninstallButton({ serverId, pluginId }: { serverId: string; pluginId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Uninstall this plugin? Jar will be deleted.")) return;
        start(async () => {
          try {
            await uninstallPlugin(serverId, pluginId);
            toast.success("Plugin uninstalled");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Uninstall failed");
          }
        });
      }}
      className="border-2 border-[#ff4444] bg-transparent text-[#ff6666] px-3 py-1 text-xs font-mono font-black uppercase tracking-wide hover:bg-[#1a0a0a] disabled:opacity-50"
    >
      {pending ? "..." : "Remove"}
    </button>
  );
}

export function RestartBanner({ serverId }: { serverId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="border-2 border-[#ffdd00] bg-[#1a1a00] px-5 py-3 flex items-center justify-between gap-4">
      <div className="text-xs font-mono text-[#ffdd00]">
        ⚠ Restart required — plugin changes apply on next server restart.
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              await restartServer(serverId);
              toast.success("Server restarting…");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Restart failed");
            }
          })
        }
        className="border-2 border-[#ffdd00] bg-[#ffdd00] text-[#1a1a00] px-4 py-1.5 text-xs font-mono font-black uppercase tracking-wide hover:bg-[#ffee33] disabled:opacity-50"
      >
        {pending ? "Restarting..." : "Restart now"}
      </button>
    </div>
  );
}
