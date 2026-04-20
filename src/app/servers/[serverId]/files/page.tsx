import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNodeKind, listDir, parentPath, readTextFile } from "@/lib/files";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileEditor } from "./file-editor";

function formatBytes(n?: number): string {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default async function FilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ serverId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { serverId } = await params;
  const { path: raw } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();
  const server = await prisma.server.findFirst({
    where: { id: serverId, ownerId: session.user.id },
  });
  if (!server) notFound();

  const current = (raw ?? "").replace(/^\/+|\/+$/g, "");
  const kind = await getNodeKind(server.id, current).catch(() => "missing" as const);
  const base = `/servers/${server.id}/files`;
  const crumbs = buildCrumbs(current);

  if (kind === "missing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Path not found: {current || "/"}</p>
          <Link href={base} className="mt-2 inline-block text-sm underline">
            Back to root
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (kind === "file") {
    const { content, binary } = await readTextFile(server.id, current);
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Breadcrumbs base={base} crumbs={crumbs} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {binary ? (
            <div className="bg-muted/40 rounded-md border p-3 font-mono text-sm">
              {content} — binary file, not editable in browser.
            </div>
          ) : (
            <FileEditor serverId={server.id} subpath={current} initial={content} />
          )}
          <Link
            href={`${base}?path=${encodeURIComponent(parentPath(current))}`}
            className="text-muted-foreground inline-block text-sm hover:underline"
          >
            ← Back to {parentPath(current) || "root"}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const entries = await listDir(server.id, current);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Breadcrumbs base={base} crumbs={crumbs} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">Empty directory.</p>
        ) : (
          <ul className="divide-y">
            {current && (
              <li className="py-2">
                <Link
                  href={`${base}?path=${encodeURIComponent(parentPath(current))}`}
                  className="text-sm hover:underline"
                >
                  ../
                </Link>
              </li>
            )}
            {entries.map((e) => (
              <li key={e.path} className="flex items-center justify-between py-2">
                <Link
                  href={`${base}?path=${encodeURIComponent(e.path)}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <span className="font-mono">
                    {e.kind === "dir" ? `${e.name}/` : e.name}
                  </span>
                  {e.kind === "dir" && <Badge variant="outline">dir</Badge>}
                </Link>
                <span className="text-muted-foreground text-xs">{formatBytes(e.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function buildCrumbs(current: string): { name: string; path: string }[] {
  if (!current) return [];
  const parts = current.split("/");
  const out: { name: string; path: string }[] = [];
  let acc = "";
  for (const p of parts) {
    acc = acc ? `${acc}/${p}` : p;
    out.push({ name: p, path: acc });
  }
  return out;
}

function Breadcrumbs({
  base,
  crumbs,
}: {
  base: string;
  crumbs: { name: string; path: string }[];
}) {
  return (
    <span className="flex flex-wrap items-center gap-1 text-base">
      <Link href={base} className="hover:underline">
        /srv/mc/&lt;server&gt;
      </Link>
      {crumbs.map((c) => (
        <span key={c.path} className="flex items-center gap-1">
          <span className="text-muted-foreground">/</span>
          <Link href={`${base}?path=${encodeURIComponent(c.path)}`} className="hover:underline">
            {c.name}
          </Link>
        </span>
      ))}
    </span>
  );
}
