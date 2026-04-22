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
    <div className="border-2 border-border bg-card">
      <div className="px-6 py-4 border-b-2 border-border bg-primary">
        <h2 className="minecraft-title text-sm text-primary-foreground tracking-wider">CONSOLE</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Log output — dark background, monospace, no rounding, sharp borders */}
        <div className="space-y-2">
          <p className="minecraft-block text-xs font-black text-foreground uppercase tracking-widest">Server Output</p>
          <div className="max-h-[400px] overflow-auto border-2 border-border bg-[#0a0a0a] p-4 font-mono text-xs leading-relaxed text-[#00ff00]">
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
        </div>

        {/* Server status indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 border border-foreground ${status === "up" ? "bg-[#00ff00]" : "bg-[#ff0000]"}`} />
          <span className="font-mono text-sm text-foreground">
            Status: <span className="minecraft-block">{status.toUpperCase()}</span>
          </span>
        </div>

        {/* Console input */}
        <ConsoleInput serverId={server.id} disabled={status !== "up"} />

        {status !== "up" && (
          <div className="border-2 border-[#ff4444] bg-[#1a0a0a] p-3">
            <p className="text-xs font-mono text-[#ff6666]">
              ⚠ Server is offline. Start it first to send commands.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
