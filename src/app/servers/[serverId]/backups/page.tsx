import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Backups ({backups.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {backups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No backups yet. The nightly restic job on the VPS will populate this list.
          </p>
        ) : (
          <ul className="divide-y">
            {backups.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-mono text-sm">{b.storageKey}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.kind} · {b.createdAt.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{formatBytes(b.sizeBytes)}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
