import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchPlugins } from "@/lib/modrinth";
import { InstallButton, UninstallButton, RestartBanner } from "./plugin-actions";

export default async function PluginsPage({
  params,
  searchParams,
}: {
  params: Promise<{ serverId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { serverId } = await params;
  const { q } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();
  const server = await prisma.server.findFirst({
    where: { id: serverId, ownerId: session.user.id },
    include: { plugins: true },
  });
  if (!server) notFound();

  const installedSlugs = new Set(server.plugins.map((p) => p.slug));
  const hits = q && q.length > 1 ? await searchPlugins(q, server.jarVersion).catch(() => []) : [];

  return (
    <div className="space-y-4">
      {server.restartRequired && <RestartBanner serverId={server.id} />}

      {/* Installed plugins */}
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Installed plugins{" "}
            <span className="text-foreground">({server.plugins.length})</span>
          </h2>
        </div>
        <div className="px-5 py-3">
          {server.plugins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No plugins installed yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {server.plugins.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{p.name}</span>
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {p.version}
                    </span>
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {p.source}
                    </span>
                    {!p.enabled && (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        disabled
                      </span>
                    )}
                  </div>
                  <UninstallButton serverId={server.id} pluginId={p.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modrinth search */}
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Search Modrinth
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <form className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search plugins (e.g. EssentialsX, LuckPerms, CoreProtect)"
              className="flex h-9 flex-1 border border-border bg-transparent px-3 text-sm font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="border border-border bg-foreground px-4 text-sm font-mono text-background hover:bg-foreground/90 transition-colors"
            >
              Search
            </button>
          </form>
          {hits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q ? "No results." : "Type a query to search the Modrinth plugin catalog."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {hits.map((h) => {
                const installed = installedSlugs.has(h.slug);
                return (
                  <li key={h.project_id} className="flex items-start justify-between gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{h.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{h.description}</div>
                      <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground font-mono">
                        <span>{h.downloads.toLocaleString()} downloads</span>
                        <span>·</span>
                        <span>latest: {h.latest_version}</span>
                      </div>
                    </div>
                    {installed ? (
                      <span className="border-2 border-border px-3 py-1 text-xs font-mono text-muted-foreground uppercase">
                        Installed
                      </span>
                    ) : (
                      <InstallButton serverId={server.id} slug={h.slug} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
