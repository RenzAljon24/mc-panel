"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { installPlugin, installPluginFromUrl, uninstallPlugin, restartServer } from "../actions";

export function InstallButton({
  serverId,
  source,
  slug,
}: {
  serverId: string;
  source: "modrinth" | "hangar";
  slug: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const msg = await installPlugin(serverId, source, slug);
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

export function UploadPluginCard({ serverId }: { serverId: string }) {
  const [pending, setPending] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const router = useRouter();

  async function onUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".jar")) {
      toast.error("Only .jar files are accepted");
      return;
    }
    setPending(true);
    setFilename(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/servers/${serverId}/plugins/upload`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; filename?: string };
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      toast.success(`Uploaded ${data.filename ?? file.name}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
      setFilename(null);
    }
  }

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Upload your own plugin
        </h2>
      </div>
      <div className="p-5 space-y-3">
        <label
          className={`flex items-center justify-between gap-4 border-2 border-dashed border-border px-4 py-6 cursor-pointer hover:border-primary transition-colors ${
            pending ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="text-sm font-mono text-muted-foreground">
            {pending
              ? `Uploading ${filename ?? "..."}`
              : "Drop or pick a .jar file (max 50 MB)"}
          </div>
          <span className="border-2 border-border bg-foreground text-background px-3 py-1 text-xs font-mono font-black uppercase tracking-wide">
            Choose file
          </span>
          <input
            type="file"
            accept=".jar,application/java-archive"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function InstallFromUrlCard({ serverId }: { serverId: string }) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState("");
  const router = useRouter();

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Install from URL
        </h2>
      </div>
      <div className="p-5 space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = url.trim();
            if (!trimmed) return;
            start(async () => {
              try {
                const msg = await installPluginFromUrl(serverId, trimmed);
                toast.success(msg);
                setUrl("");
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Install failed");
              }
            });
          }}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/plugin.jar"
            className="flex h-9 flex-1 border border-border bg-transparent px-3 text-sm font-mono focus:outline-none focus:border-primary"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !url.trim()}
            className="border border-border bg-foreground px-4 text-sm font-mono text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {pending ? "..." : "Install"}
          </button>
        </form>
        <p className="text-[10px] font-mono text-muted-foreground">
          Direct .jar URLs only. File is verified as a JAR (max 50 MB) before saving.
        </p>
      </div>
    </div>
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
