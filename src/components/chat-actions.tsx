"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Folder } from "lucide-react";

interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}

/** Derive a sensible entry title from the markdown (frontmatter/heading/first line). */
function deriveTitle(md: string): string {
  const body = md.replace(/^---[\s\S]*?---/, "").trim();
  const heading = body.match(/^#{1,6}\s+(.+)$/m);
  if (heading) return heading[1].trim().slice(0, 80);
  const first = body.split("\n").find((l) => l.trim());
  return (
    (first ? first.replace(/[#*_`>[\]]/g, "").trim().slice(0, 80) : "") ||
    "Untitled"
  );
}

/** Depth-first folder list (children directly under their parent) for the picker. */
function orderedFolders(tree: TreeNode[]): { node: TreeNode; depth: number }[] {
  const byParent = new Map<string | null, TreeNode[]>();
  for (const n of tree) {
    const key = n.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  }
  const out: { node: TreeNode; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      if (c.kind === "folder") {
        out.push({ node: c, depth });
        walk(c.id, depth + 1);
      }
    }
  };
  walk(null, 0);
  return out;
}

/** Save a chat's final answer as a vault entry at a chosen location, or copy it. */
export function ChatActions({ markdown }: { markdown: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!markdown.trim()) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function openPicker() {
    setOpen(true);
    setError("");
    setParentId(null);
    setTitle(deriveTitle(markdown));
    if (tree === null) {
      try {
        const res = await fetch("/api/nodes/tree");
        const data = await res.json();
        setTree(Array.isArray(data.tree) ? data.tree : []);
      } catch {
        setTree([]);
      }
    }
  }

  const folderList = orderedFolders(tree ?? []);

  async function save() {
    if (busy || !title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "entry",
          parentId,
          title,
          content: markdown,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save.");
      const path: string[] | undefined = data.node?.path;
      setOpen(false);
      if (path?.length) {
        router.push("/vault/" + path.map(encodeURIComponent).join("/"));
      } else {
        router.push("/vault");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  const optionClass = (selected: boolean) =>
    `flex w-full items-center justify-between gap-2 py-1.5 pr-2.5 text-left text-sm transition-colors ${
      selected ? "bg-accent/10 text-accent-soft" : "text-muted hover:bg-surface-2"
    }`;

  return (
    <div className="relative flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-text"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={openPicker}
        className="rounded-lg border border-accent-dim/50 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:border-accent-dim hover:bg-accent/15"
      >
        Save to Vault
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => !busy && setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border-strong bg-surface p-3 shadow-2xl shadow-black/60 [animation:cairn-rise-in_150ms_ease-out]">
            <label className="mb-1.5 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              placeholder="Entry title"
              className="mb-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
            />

            <p className="mb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
              Destination folder
            </p>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setParentId(null)}
                className={optionClass(parentId === null) + " pl-2.5"}
              >
                <span className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 shrink-0 text-accent-dim" />
                  Top level
                </span>
                {parentId === null && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
              {tree === null ? (
                <p className="px-2.5 py-2 font-mono text-[0.6875rem] text-faint">
                  Loading…
                </p>
              ) : (
                folderList.map(({ node: f, depth }) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setParentId(f.id)}
                    style={{ paddingLeft: `${0.625 + depth * 0.85}rem` }}
                    className={optionClass(parentId === f.id)}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 shrink-0 text-accent-dim" />
                      <span className="truncate">{f.title}</span>
                    </span>
                    {parentId === f.id && (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {error && <p className="mt-2 text-xs text-accent-soft">{error}</p>}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy || !title.trim()}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
              >
                {busy ? "Saving…" : "Save here"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatActions;
