import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ServersLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between px-6">
          <Link href="/servers" className="font-mono text-sm font-bold tracking-widest text-foreground hover:text-primary transition-colors">
            MC PANEL
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground font-mono">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
