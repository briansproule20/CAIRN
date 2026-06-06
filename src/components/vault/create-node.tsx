"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, FilePlus, Plus, X } from "lucide-react";

type Kind = "folder" | "entry";

/**
 * Inline "new folder / new entry" control for the current location.
 * Pass `defaultKind` (+ `label`) to render a single button that opens straight
 * to that kind — used for "New section" (a top-level folder).
 */
export function CreateNode({
  parentId,
  defaultKind,
  label = "New",
}: {
  parentId: string | null;
  defaultKind?: Kind;
  label?: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function open(k: Kind) {
    setKind(k);
    setTitle("");
    setError("");
  }
  function close() {
    setKind(null);
    setError("");
  }

  async function create() {
    if (!title.trim() || busy || !kind) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, kind, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create that.");
      close();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create that.");
    } finally {
      setBusy(false);
    }
  }

  if (!kind) {
    if (defaultKind) {
      return (
        <button
          type="button"
          onClick={() => open(defaultKind)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:bg-accent/10 hover:text-accent-soft"
        >
          {defaultKind === "folder" ? (
            <FolderPlus className="h-3.5 w-3.5" />
          ) : (
            <FilePlus className="h-3.5 w-3.5" />
          )}
          {label}
        </button>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 p-0.5">
        <span className="flex items-center gap-1 pl-2 pr-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
          <Plus className="h-3 w-3" />
          New
        </span>
        <button
          type="button"
          onClick={() => open("folder")}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent-soft"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          Folder
        </button>
        <button
          type="button"
          onClick={() => open("entry")}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent-soft"
        >
          <FilePlus className="h-3.5 w-3.5" />
          Entry
        </button>
      </div>
    );
  }

  const Icon = kind === "folder" ? FolderPlus : FilePlus;

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-accent-dim">
        <Icon className="h-3.5 w-3.5" />
        New {kind}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
            if (e.key === "Escape") close();
          }}
          autoFocus
          placeholder={kind === "folder" ? "Folder name" : "Entry title"}
          disabled={busy}
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <button
          type="button"
          onClick={create}
          disabled={busy || !title.trim()}
          className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
        >
          {busy ? "…" : "Create"}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Cancel"
          className="rounded-lg p-2 text-muted transition-colors hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-accent-soft">{error}</p>}
    </div>
  );
}

export default CreateNode;
