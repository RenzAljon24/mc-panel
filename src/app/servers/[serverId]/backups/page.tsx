import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatBytes(n: bigint): string {
  const num = Number(n);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / 1024 / 1024).toFixed(1)} MB`;
  return `${(num / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default async function BackupsPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();
  const server = await prisma.server.findFirst({
    where: { id: serverId, ownerId: session.user.id },
  });
  if (!server) notFound();

  const backups = await prisma.backup.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Backups <span className="text-foreground">({backups.length})</span>
        </h2>
      </div>
      <div className="px-5 py-3">
        {backups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No backups yet. The nightly restic job on the VPS will populate this list.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {backups.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-foreground truncate">{b.storageKey}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {b.kind} · {b.createdAt.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground font-mono ml-4 shrink-0">
                  {formatBytes(b.sizeBytes)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
