import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchPlugins } from "@/lib/modrinth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const hits = q && q.length > 1 ? await searchPlugins(q, server.jarVersion).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Installed plugins ({server.plugins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {server.plugins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plugins installed yet.</p>
          ) : (
            <ul className="space-y-2">
              {server.plugins.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{p.name}</span>
                    <Badge variant="secondary">{p.version}</Badge>
                    {!p.enabled && <Badge variant="outline">disabled</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{p.source}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Modrinth</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search plugins (e.g. EssentialsX, LuckPerms, CoreProtect)"
              className="flex h-9 flex-1 rounded-md border bg-transparent px-3 text-sm"
            />
            <button type="submit" className="rounded-md bg-foreground px-4 text-sm text-background">
              Search
            </button>
          </form>
          {hits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q ? "No results." : "Type a query to search the Modrinth plugin catalog."}
            </p>
          ) : (
            <ul className="space-y-3">
              {hits.map((h) => (
                <li key={h.project_id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{h.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{h.description}</div>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      <span>{h.downloads.toLocaleString()} downloads</span>
                      <span>·</span>
                      <span>latest: {h.latest_version}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm opacity-60"
                    disabled
                    title="Install wired up in Phase 6 (needs VPS filesystem)"
                  >
                    Install
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
