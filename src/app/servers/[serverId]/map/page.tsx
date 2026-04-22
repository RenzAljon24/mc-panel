import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { MapFrame } from "./map-frame";

export default async function MapPage({
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
  const dynmapPort = Number(process.env.DYNMAP_PORT ?? 8123);

  return (
    <div className="border-2 border-border bg-card">
      <div className="px-6 py-4 border-b-2 border-border bg-primary">
        <h2 className="minecraft-title text-sm text-primary-foreground tracking-wider">MAP</h2>
      </div>
      <div className="p-0">
        {status === "up" ? (
          <MapFrame port={dynmapPort} />
        ) : (
          <p className="font-mono text-sm text-muted-foreground p-6">
            Server is {status}. Start it to view the live map.
          </p>
        )}
      </div>
    </div>
  );
}
