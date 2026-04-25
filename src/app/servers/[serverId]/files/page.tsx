import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNodeKind, listDir, parentPath, readTextFile } from "@/lib/files";
import { FileEditor } from "./file-editor";
import { FilesBrowser } from "./files-browser";

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
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Files</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground font-mono">Path not found: {current || "/"}</p>
          <Link href={base} className="mt-2 inline-block text-sm text-primary hover:underline font-mono">
            Back to root
          </Link>
        </div>
      </div>
    );
  }

  if (kind === "file") {
    const { content, binary } = await readTextFile(server.id, current);
    return (
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border">
          <Breadcrumbs base={base} crumbs={crumbs} />
        </div>
        <div className="p-5 space-y-3">
          {binary ? (
            <div className="border border-border bg-[#FAFAFA] p-3 font-mono text-sm text-muted-foreground">
              {content} — binary file, not editable in browser.
            </div>
          ) : (
            <FileEditor serverId={server.id} subpath={current} initial={content} />
          )}
          <Link
            href={`${base}?path=${encodeURIComponent(parentPath(current))}`}
            className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors"
          >
            ← Back to {parentPath(current) || "root"}
          </Link>
        </div>
      </div>
    );
  }

  const entries = await listDir(server.id, current);

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border">
        <Breadcrumbs base={base} crumbs={crumbs} />
      </div>
      <FilesBrowser
        serverId={server.id}
        current={current}
        parent={parentPath(current)}
        entries={entries}
        base={base}
      />
    </div>
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
    <span className="flex flex-wrap items-center gap-1 text-xs font-mono text-muted-foreground">
      <Link href={base} className="hover:text-foreground transition-colors">
        /srv/mc/&lt;server&gt;
      </Link>
      {crumbs.map((c) => (
        <span key={c.path} className="flex items-center gap-1">
          <span>/</span>
          <Link
            href={`${base}?path=${encodeURIComponent(c.path)}`}
            className="hover:text-foreground transition-colors"
          >
            {c.name}
          </Link>
        </span>
      ))}
    </span>
  );
}
