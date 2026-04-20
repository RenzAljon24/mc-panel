import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { PowerButtons } from "./power-buttons";

export default async function PowerPage({
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

  const status = await getStatus(server.id);

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Power</h2>
        <StatusPill status={status} />
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          With lazymc running, the server boots automatically when a player joins. These controls are
          for manual override.
        </p>
        <PowerButtons serverId={server.id} status={status} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const dot =
    status === "up"
      ? "bg-green-500"
      : status === "starting" || status === "stopping"
      ? "bg-yellow-400"
      : status === "error"
      ? "bg-red-500"
      : "bg-gray-300";
  return (
    <div className="flex items-center gap-1.5 rounded border border-border px-2 py-0.5 text-xs font-mono text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </div>
  );
}
