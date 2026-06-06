"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Sparkles, Trash2, X } from "lucide-react";

/**
 * EntryEditor — wraps an entry's read view and provides in-app editing.
 *
 * Read mode renders `children` (the server-rendered MDX + backlinks) under a
 * small Edit affordance. Edit mode exposes title / content / tags / status,
 * with Save (PATCH), Format with Poncho, and Delete.
 */
export function EntryEditor({
  id,
  parentPath,
  title: initialTitle,
  content: initialContent,
  tags: initialTags,
  status: initialStatus,
  meta,
  children,
}: {
  id: string;
  /** Where Delete redirects to — parent folder URL or "/vault". */
  parentPath: string;
  title: string;
  content: string;
  tags: string[];
  status: string;
  /** Status · updated line, shown in read mode. */
  meta: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [status, setStatus] = useState(initialStatus);

  const [busy, setBusy] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags.join(", "));
    setStatus(initialStatus);
    setError("");
    setEditing(true);
  }

  async function save() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/nodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          status,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save changes.");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function formatWithPoncho() {
    if (!content.trim() || formatting) return;
    setFormatting(true);
    setError("");
    try {
      const res = await fetch("/api/poncho/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Poncho couldn't format that.");
      if (typeof data.markdown === "string") setContent(data.markdown);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Poncho couldn't format that.");
    } finally {
      setFormatting(false);
    }
  }

  async function remove() {
    if (deleting) return;
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/nodes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't delete that.");
      }
      router.push(parentPath);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete that.");
      setDeleting(false);
    }
  }

  if (!editing) {
    return (
      <article className="max-w-3xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-text">{initialTitle}</h1>
            <p className="mt-1 font-mono text-xs text-faint">{meta}</p>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:bg-accent/10 hover:text-accent-soft"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </header>
        {children}
      </article>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-serif text-2xl text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError("");
          }}
          aria-label="Cancel editing"
          className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <label className="mb-1.5 block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
        Content (markdown)
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        spellCheck={false}
        disabled={busy}
        placeholder="Write in markdown…"
        className="mb-4 block w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="lore, timeline"
            disabled={busy}
            className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Status
          </label>
          <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
            {(["draft", "published"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                disabled={busy}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  status === s
                    ? "bg-accent/15 text-accent-soft"
                    : "text-muted hover:text-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-accent-soft">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={save}
          disabled={busy || !title.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={formatWithPoncho}
          disabled={formatting || busy || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:text-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {formatting ? "Formatting…" : "Format with Poncho"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting || busy}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default EntryEditor;
