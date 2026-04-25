import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { ServerTabs } from "./server-tabs";

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
    <div className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs font-mono text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </div>
  );
}

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    <div className="space-y-0">
      {/* Server header */}
      <div className="border-b border-border pb-4 sm:pb-5 mb-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Link href="/servers" className="hover:text-foreground transition-colors">
                servers
              </Link>
              <span>/</span>
              <span className="text-foreground truncate">{server.name}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
              {server.name}
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-mono wrap-break-word">
              {server.jarType} {server.jarVersion} · Java :{server.portJava} · Bedrock :{server.portBedrock}
            </p>
          </div>
          <div className="sm:shrink-0">
            <StatusPill status={status} />
          </div>
        </div>
      </div>
      <ServerTabs serverId={server.id} />
      <div className="pt-4 sm:pt-6">{children}</div>
    </div>
  );
}
