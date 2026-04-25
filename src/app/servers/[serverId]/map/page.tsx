import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Map as MapIcon } from "lucide-react";
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
    <section className="border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
            Live Map
          </h2>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {status === "up" ? "Live" : `Server ${status}`}
        </span>
      </header>
      {status === "up" ? (
        <MapFrame port={dynmapPort} />
      ) : (
        <div className="px-6 py-12 text-center">
          <MapIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-foreground">Server is {status}.</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Start it to view the live map.
          </p>
        </div>
      )}
    </section>
  );
}
