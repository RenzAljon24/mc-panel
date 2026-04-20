import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ServersPage() {
  const servers = await prisma.server.findMany({ orderBy: { createdAt: "asc" } });

  const withStatus = await Promise.all(
    servers.map(async (s) => ({ ...s, liveStatus: await getStatus(s.id) })),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Servers</h1>
        <span className="text-sm text-muted-foreground">{servers.length} server(s)</span>
      </div>

      {withStatus.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No servers yet. Run the seed script to create one.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {withStatus.map((s) => (
          <Link key={s.id} href={`/servers/${s.id}`}>
            <Card className="transition hover:border-foreground/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{s.name}</CardTitle>
                  <StatusBadge status={s.liveStatus} />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>
                  {s.jarType} {s.jarVersion} · {s.ramMb} MB RAM
                </div>
                <div>Java :{s.portJava} · Bedrock :{s.portBedrock}</div>
                <div>online-mode={String(s.onlineMode)} · whitelist={String(s.whitelist)}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "up" ? "default" : status === "starting" || status === "stopping" ? "secondary" : "outline";
  return <Badge variant={variant as "default" | "secondary" | "outline"}>{status}</Badge>;
}
