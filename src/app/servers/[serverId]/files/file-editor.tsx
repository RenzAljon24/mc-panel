"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveServerFile } from "../actions";

export function FileEditor({
  serverId,
  subpath,
  initial,
}: {
  serverId: string;
  subpath: string;
  initial: string;
}) {
  const [content, setContent] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const dirty = content !== initial;

  function save() {
    start(async () => {
      try {
        await saveServerFile(serverId, subpath, content);
        toast.success("Saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        className="bg-muted/40 h-[480px] w-full rounded-md border p-3 font-mono text-xs leading-relaxed focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {content.length.toLocaleString()} chars · {dirty ? "unsaved changes" : "saved"}
        </span>
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
