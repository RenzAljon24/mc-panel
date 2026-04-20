import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server settings</CardTitle>
      </CardHeader>
      <CardContent>
        <SettingsForm
          serverId={server.id}
          defaults={{
            name: server.name,
            motd: server.motd,
            maxPlayers: server.maxPlayers,
            viewDistance: server.viewDistance,
            difficulty: server.difficulty,
            gamemode: server.gamemode,
            onlineMode: server.onlineMode,
            whitelist: server.whitelist,
            idleTimeoutSec: server.idleTimeoutSec,
          }}
        />
      </CardContent>
    </Card>
  );
}
