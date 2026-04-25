"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Folder, FileText, Trash2, Upload, FolderPlus, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  uploadServerFiles,
  deleteServerNode,
  createServerFolder,
} from "../actions";

type Entry = {
  name: string;
  path: string;
  kind: "file" | "dir";
  sizeBytes?: number;
};

function formatBytes(n?: number): string {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FilesBrowser({
  serverId,
  current,
  parent,
  entries,
  base,
}: {
  serverId: string;
  current: string;
  parent: string;
  entries: Entry[];
  base: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);

  function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    start(async () => {
      try {
        const fd = new FormData();
        fd.set("dir", current);
        for (const f of list) fd.append("files", f);
        const count = await uploadServerFiles(serverId, fd);
        toast.success(`Uploaded ${count} file${count === 1 ? "" : "s"}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    setDragDepth(0);
    const files = e.dataTransfer?.files;
    if (files && files.length) uploadFiles(files);
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    if (!Array.from(e.dataTransfer?.types ?? []).includes("Files")) return;
    e.preventDefault();
    setDragDepth((d) => d + 1);
    setDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragDepth((d) => {
      const next = d - 1;
      if (next <= 0) setDragging(false);
      return Math.max(0, next);
    });
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }

  function deleteEntry(entry: Entry) {
    const label = entry.kind === "dir" ? `folder "${entry.name}" and its contents` : `"${entry.name}"`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    start(async () => {
      try {
        await deleteServerNode(serverId, entry.path);
        toast.success(`Deleted ${entry.name}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  function newFolder() {
    const name = window.prompt("New folder name");
    if (!name) return;
    start(async () => {
      try {
        await createServerFolder(serverId, current, name);
        toast.success(`Created ${name}/`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  const showParentRow = current.length > 0;

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      className="relative"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-border">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {entries.length} item{entries.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
          <Button variant="outline" size="sm" onClick={newFolder} disabled={pending}>
            <FolderPlus className="h-3.5 w-3.5" />
            New folder
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {showParentRow && (
          <li className="flex items-center px-5 py-2.5">
            <Link
              href={`${base}?path=${encodeURIComponent(parent)}`}
              className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>../</span>
            </Link>
          </li>
        )}
        {entries.length === 0 && !showParentRow ? (
          <li className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground font-mono">
              Empty directory — drop files here or click Upload.
            </p>
          </li>
        ) : (
          entries.map((e) => (
            <li
              key={e.path}
              className="group/row flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-accent/40 transition-colors"
            >
              <Link
                href={`${base}?path=${encodeURIComponent(e.path)}`}
                className="flex min-w-0 items-center gap-2 text-sm font-mono text-foreground hover:text-primary transition-colors"
              >
                {e.kind === "dir" ? (
                  <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">
                  {e.name}
                  {e.kind === "dir" ? "/" : ""}
                </span>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {formatBytes(e.sizeBytes)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${e.name}`}
                  onClick={() => deleteEntry(e)}
                  disabled={pending}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      {dragging && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
            "border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[1px]",
          )}
        >
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-6 w-6" />
            <span className="text-sm font-mono uppercase tracking-widest">
              Drop to upload to /{current || "root"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
