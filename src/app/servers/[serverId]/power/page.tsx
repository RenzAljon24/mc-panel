import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Power</CardTitle>
            <CardDescription>
              With lazymc running, the server boots automatically when a player joins. These controls are
              for manual override.
            </CardDescription>
          </div>
          <Badge variant={status === "up" ? "default" : "outline"}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <PowerButtons serverId={server.id} status={status} />
      </CardContent>
    </Card>
  );
}
