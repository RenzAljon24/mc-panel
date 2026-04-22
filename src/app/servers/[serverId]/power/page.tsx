import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/systemd";
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
    <div className="border-2 border-border bg-card">
      <div className="px-6 py-4 border-b-2 border-border bg-primary flex items-center justify-between">
        <h2 className="minecraft-title text-sm text-primary-foreground tracking-wider">POWER</h2>
        <StatusPill status={status} />
      </div>
      <div className="p-6 space-y-6">
        <p className="font-mono text-sm text-muted-foreground leading-relaxed">
          Server runs 24/7 under systemd. Use these controls to restart after config changes or stop for maintenance.
        </p>
        <PowerButtons serverId={server.id} status={status} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const statusConfig = {
    up: { dot: "bg-[#22cc22]", label: "ONLINE", border: "border-[#22cc22]", bg: "bg-[#001100]", text: "text-[#22cc22]" },
    starting: { dot: "bg-[#ffdd00]", label: "STARTING", border: "border-[#ffdd00]", bg: "bg-[#1a1a00]", text: "text-[#ffdd00]" },
    stopping: { dot: "bg-[#ff9900]", label: "STOPPING", border: "border-[#ff9900]", bg: "bg-[#1a0a00]", text: "text-[#ff9900]" },
    error: { dot: "bg-[#ff3333]", label: "ERROR", border: "border-[#ff3333]", bg: "bg-[#1a0000]", text: "text-[#ff3333]" },
    idle: { dot: "bg-[#666666]", label: "OFFLINE", border: "border-[#666666]", bg: "bg-[#0a0a0a]", text: "text-[#666666]" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;

  return (
    <div className={`minecraft-block flex items-center gap-2 border-2 ${config.border} ${config.bg} ${config.text} px-4 py-2 text-xs font-black uppercase tracking-wide`}>
      <span className={`h-2 w-2 ${config.dot}`} />
      {config.label}
    </div>
  );
}
