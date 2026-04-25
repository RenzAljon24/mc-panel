import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Terminal } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailLog } from "@/lib/logs";
import { getStatus } from "@/lib/systemd";
import { ConsoleInput } from "./console-input";
import { ConsoleView } from "./console-view";

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
  const isOnline = status === "up";

  return (
    <section className="border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
            Console
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isOnline
                ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]"
                : status === "starting" || status === "stopping"
                  ? "bg-yellow-400 animate-pulse"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-gray-400"
            }`}
          />
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {status}
          </span>
        </div>
      </header>

      <div className="p-4 sm:p-5 space-y-4">
        <ConsoleView initialLines={lines} />
        <ConsoleInput serverId={server.id} disabled={!isOnline} />
      </div>
    </section>
  );
}
