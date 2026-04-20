"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateSettings } from "../actions";

type Defaults = {
  name: string;
  motd: string;
  maxPlayers: number;
  viewDistance: number;
  difficulty: string;
  gamemode: string;
  onlineMode: boolean;
  whitelist: boolean;
  idleTimeoutSec: number;
};

export function SettingsForm({ serverId, defaults }: { serverId: string; defaults: Defaults }) {
  const [form, setForm] = useState(defaults);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        await updateSettings(serverId, form);
        toast.success("Settings saved (restart required for some fields)");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label="Server name">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="MOTD">
        <Input value={form.motd} onChange={(e) => setForm({ ...form, motd: e.target.value })} />
      </Field>
      <Field label="Max players">
        <Input
          type="number"
          min={1}
          max={100}
          value={form.maxPlayers}
          onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
        />
      </Field>
      <Field label="View distance (chunks)">
        <Input
          type="number"
          min={3}
          max={32}
          value={form.viewDistance}
          onChange={(e) => setForm({ ...form, viewDistance: Number(e.target.value) })}
        />
      </Field>
      <Field label="Difficulty">
        <select
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
        >
          {["peaceful", "easy", "normal", "hard"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Default gamemode">
        <select
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={form.gamemode}
          onChange={(e) => setForm({ ...form, gamemode: e.target.value })}
        >
          {["survival", "creative", "adventure", "spectator"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Idle timeout (seconds)">
        <Input
          type="number"
          min={60}
          max={3600}
          value={form.idleTimeoutSec}
          onChange={(e) => setForm({ ...form, idleTimeoutSec: Number(e.target.value) })}
        />
      </Field>
      <div className="flex items-center gap-6 md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.onlineMode}
            onChange={(e) => setForm({ ...form, onlineMode: e.target.checked })}
          />
          Online mode (uncheck for cracked)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.whitelist}
            onChange={(e) => setForm({ ...form, whitelist: e.target.checked })}
          />
          Whitelist enabled
        </label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
