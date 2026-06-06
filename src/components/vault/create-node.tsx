"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, FileText, Plus, X } from "lucide-react";

/** Inline "new folder / new entry" control for the current location. */
export function CreateNode({ parentId }: { parentId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"folder" | "entry">("folder");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!title.trim() || busy) return;
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
      setTitle("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create that.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:bg-accent/10 hover:text-accent-soft"
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </button>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
        {(["folder", "entry"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              kind === k
                ? "bg-accent/15 text-accent-soft"
                : "text-muted hover:text-text"
            }`}
          >
            {k === "folder" ? (
              <FolderPlus className="h-3.5 w-3.5" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {k}
          </button>
        ))}
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
            if (e.key === "Escape") setOpen(false);
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
          onClick={() => setOpen(false)}
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
