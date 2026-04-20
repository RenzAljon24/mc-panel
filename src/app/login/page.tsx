"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* ASCII-art brand mark */}
        <div className="text-center">
          <pre className="inline-block font-mono text-[10px] leading-tight text-foreground select-none">
{`███╗   ███╗ ██████╗
████╗ ████║██╔════╝
██╔████╔██║██║
██║╚██╔╝██║██║
██║ ╚═╝ ██║╚██████╗
╚═╝     ╚═╝ ╚═════╝  PANEL`}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">Sign in to manage your Minecraft server</p>
        </div>

        <div className="border border-border p-6 space-y-5">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/servers";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Login failed");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-muted h-16 animate-pulse rounded" />
      <div className="bg-muted h-16 animate-pulse rounded" />
      <div className="bg-muted h-9 animate-pulse rounded" />
    </div>
  );
}
