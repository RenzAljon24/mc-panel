import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailLog } from "@/lib/logs";
import { getStatus } from "@/lib/systemd";
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
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Console</h2>
      </div>
      <div className="p-5 space-y-3">
        {/* Log output — black on white monospace, no rounding, thin 1px border */}
        <div className="max-h-[500px] overflow-auto border border-border bg-[#FAFAFA] p-3 font-mono text-xs leading-relaxed">
          {lines.length === 0 ? (
            <p className="text-muted-foreground">No log output yet.</p>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap break-all text-foreground">
                {l}
              </div>
            ))
          )}
        </div>
        <ConsoleInput serverId={server.id} disabled={status !== "up"} />
        {status !== "up" && (
          <p className="text-xs text-muted-foreground font-mono">
            Server is {status}. Start it first to send commands.
          </p>
        )}
      </div>
    </div>
  );
}
