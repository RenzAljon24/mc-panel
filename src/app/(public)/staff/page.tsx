import type { Metadata } from "next";
import { STAFF } from "@/lib/site-content";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Staff",
  description: "Meet the team keeping the server running.",
};

const ROLE_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  Owner: {
    border: "border-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    text: "text-[#f59e0b]",
  },
  Admin: {
    border: "border-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    text: "text-[#ef4444]",
  },
  Moderator: {
    border: "border-[#3b82f6]",
    bg: "bg-[#3b82f6]/10",
    text: "text-[#3b82f6]",
  },
  Builder: {
    border: "border-[#a855f7]",
    bg: "bg-[#a855f7]/10",
    text: "text-[#a855f7]",
  },
};

const ROLE_ORDER = ["Owner", "Admin", "Moderator", "Builder"];

export default function StaffPage() {
  const sorted = [...STAFF].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  );

  // Group by role
  const groups: Record<string, typeof STAFF> = {};
  for (const member of sorted) {
    if (!groups[member.role]) groups[member.role] = [];
    groups[member.role].push(member);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="minecraft-title text-xl sm:text-2xl text-[#e8e8e8]">
          Staff Team
        </h1>
        <p className="text-sm font-mono text-[#666] leading-relaxed">
          Have a question or need help? Reach out to any staff member in-game or
          on Discord.
        </p>
      </div>

      {/* Role groups */}
      {ROLE_ORDER.filter((r) => groups[r]).map((role) => {
        const styles = ROLE_STYLES[role] ?? {
          border: "border-[#555]",
          bg: "bg-[#555]/10",
          text: "text-[#555]",
        };
        return (
          <section key={role} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`inline-flex items-center px-3 py-1 text-[10px] font-mono font-bold border ${styles.border} ${styles.bg} ${styles.text} uppercase tracking-widest`}
              >
                {role}
              </div>
              <span className="flex-1 h-px bg-[#1a1a1a]" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups[role].map((member) => (
                <Card
                  key={member.name}
                  className="bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#2a2a2a] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {member.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.avatarUrl}
                          alt={`${member.name}'s Minecraft avatar`}
                          className="size-14 border border-[#2a2a2a] bg-[#0a0a0a] shrink-0"
                          style={{ imageRendering: "pixelated" }}
                          width={56}
                          height={56}
                        />
                      ) : (
                        <div className="size-14 border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center shrink-0">
                          <span className="text-xl font-mono text-[#4ade80]">
                            {member.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-mono text-sm font-bold text-[#e8e8e8] truncate">
                          {member.name}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold border ${styles.border} ${styles.bg} ${styles.text}`}
                        >
                          {role.toUpperCase()}
                        </span>
                        {member.bio && (
                          <p className="text-xs font-mono text-[#555] leading-relaxed pt-1">
                            {member.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
