import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailLog } from "@/lib/logs";
import { getStatus } from "@/lib/systemd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsoleInput } from "./console-input";

export default async function ConsolePage({
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

  const [status, lines] = await Promise.all([getStatus(server.id), tailLog(server.id, 200)]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/40 max-h-[500px] overflow-auto rounded-md border p-3 font-mono text-xs leading-relaxed">
          {lines.length === 0 ? (
            <p className="text-muted-foreground">No log output yet.</p>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {l}
              </div>
            ))
          )}
        </div>
        <ConsoleInput serverId={server.id} disabled={status !== "up"} />
        {status !== "up" && (
          <p className="text-muted-foreground text-xs">
            Server is {status}. Start it first to send commands.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
