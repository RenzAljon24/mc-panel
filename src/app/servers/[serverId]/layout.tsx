import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { Badge } from "@/components/ui/badge";
import { ServerTabs } from "./server-tabs";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/servers" className="text-muted-foreground text-sm hover:underline">
              Servers
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <h1 className="text-2xl font-semibold">{server.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {server.jarType} {server.jarVersion} · Java :{server.portJava} · Bedrock :{server.portBedrock}
          </p>
        </div>
        <Badge variant={status === "up" ? "default" : "outline"}>{status}</Badge>
      </div>
      <ServerTabs serverId={server.id} />
      <div>{children}</div>
    </div>
  );
}
