"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Folder,
  FolderPlus,
  FilePlus,
  Sparkles,
  Type,
  Bold,
  Italic,
  Heading2,
  List,
  Quote,
  Code,
  Link2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}

type Kind = "folder" | "entry";

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

export default function EditorPage() {
  const router = useRouter();

  const [kind, setKind] = useState<Kind>("entry");
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [error, setError] = useState("");
  const [showMd, setShowMd] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Load the owner's folder tree once for the destination picker.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/nodes/tree");
        const data = await res.json();
        if (alive) setTree(Array.isArray(data.tree) ? data.tree : []);
      } catch {
        if (alive) setTree([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const folderList = orderedFolders(tree ?? []);

  // Insert markdown around the selection (or a placeholder) at the cursor.
  function applyMarkdown(k: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const put = (before: string, after: string, ph: string) => {
      const text = sel || ph;
      setContent(
        content.slice(0, start) + before + text + after + content.slice(end)
      );
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(
          start + before.length,
          start + before.length + text.length
        );
      });
    };
    switch (k) {
      case "bold":
        return put("**", "**", "bold");
      case "italic":
        return put("*", "*", "italic");
      case "code":
        return put("`", "`", "code");
      case "link":
        return put("[", "](url)", "text");
      case "h2":
        return put("## ", "", "Heading");
      case "list":
        return put("- ", "", "item");
      case "quote":
        return put("> ", "", "quote");
    }
  }

  const MD_TOOLS = [
    { k: "h2", label: "Heading", Icon: Heading2 },
    { k: "bold", label: "Bold", Icon: Bold },
    { k: "italic", label: "Italic", Icon: Italic },
    { k: "list", label: "List", Icon: List },
    { k: "quote", label: "Quote", Icon: Quote },
    { k: "code", label: "Code", Icon: Code },
    { k: "link", label: "Link", Icon: Link2 },
  ] as const;

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

  async function create() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          parentId,
          title: title.trim(),
          ...(kind === "entry"
            ? {
                content,
                status,
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't create that.");
      const path: string[] | undefined = data.node?.path;
      if (path?.length) {
        router.push("/vault/" + path.map(encodeURIComponent).join("/"));
      } else {
        router.push("/vault");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create that.");
      setBusy(false);
    }
  }

  const optionClass = (selected: boolean) =>
    `flex w-full items-center justify-between gap-2 py-1.5 pr-2.5 text-left text-sm transition-colors ${
      selected ? "bg-accent/10 text-accent-soft" : "text-muted hover:bg-surface-2"
    }`;

  return (
    <div className="flex min-h-dvh flex-col bg-base text-text">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors"
            aria-label="Back to vault"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="text-muted transition-colors group-hover:text-accent"
            >
              <path d="M10 12 6 8l4-4" />
            </svg>
            <span className="font-serif text-lg tracking-tight text-text transition-colors group-hover:text-accent-soft">
              CAIRN
            </span>
          </Link>
          <span aria-hidden className="text-border-strong">
            /
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-faint">
            New
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-serif text-2xl text-text">Create</h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Add an entry or a folder to your vault.
        </p>

        {/* 1. Pick type */}
        <fieldset className="mb-6">
          <legend className="mb-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Type
          </legend>
          <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
            {(
              [
                { k: "entry", label: "Entry", Icon: FilePlus },
                { k: "folder", label: "Folder", Icon: FolderPlus },
              ] as const
            ).map(({ k, label, Icon }) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  kind === k
                    ? "bg-accent/15 text-accent-soft"
                    : "text-muted hover:text-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 2. Name it */}
        <div className="mb-6">
          <label className="mb-1.5 block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            {kind === "folder" ? "Folder name" : "Title"}
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            autoFocus
            placeholder={kind === "folder" ? "Folder name" : "Entry title"}
            disabled={busy}
            className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-serif text-xl text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>

        {/* 2b. Destination folder (depth-first picker) */}
        <div className="mb-6">
          <p className="mb-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
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
        </div>

        {/* 3. Entry-only: content editor */}
        {kind === "entry" && (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
                Content
              </label>
              <button
                type="button"
                onClick={() => setShowMd((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-faint transition-colors hover:text-accent-soft"
              >
                <Type className="h-3 w-3" />
                {showMd ? "Done" : "Add markdown"}
              </button>
            </div>
            {showMd && (
              <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-surface-2 p-1">
                {MD_TOOLS.map(({ k, label, Icon }) => (
                  <Tooltip key={k}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={label}
                        onClick={() => applyMarkdown(k)}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-accent/10 hover:text-accent-soft"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
            <textarea
              ref={taRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              disabled={busy}
              placeholder="Write here — just plain text. Use “Add markdown” for headings, lists, links…"
              className="mb-4 block w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
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
          </>
        )}

        {error && <p className="mb-3 text-xs text-accent-soft">{error}</p>}

        {/* 4. Create */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={create}
            disabled={busy || !title.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
          >
            {busy
              ? "Creating…"
              : kind === "folder"
                ? "Create folder"
                : "Create entry"}
          </button>
          {kind === "entry" && (
            <button
              type="button"
              onClick={formatWithPoncho}
              disabled={formatting || busy || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:text-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {formatting ? "Formatting…" : "Format with Poncho"}
            </button>
          )}
        </div>

        {/* Help — collapsible, quiet */}
        <div className="mt-10 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-expanded={helpOpen}
            className="flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint transition-colors hover:text-muted"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${
                helpOpen ? "rotate-90" : ""
              }`}
            />
            How the vault works
          </button>
          {helpOpen && (
            <ul className="mt-3 space-y-2 pl-5 text-xs leading-relaxed text-muted">
              <li>
                Entries and folders live in your private, Neon-backed vault,
                partitioned to your account.
              </li>
              <li>
                Nest folders as deep as you like; drag items in the sidebar to
                reorganize.
              </li>
              <li>
                Edit any entry in place from its page — write plain text and use
                “Add markdown” for formatting.
              </li>
              <li>
                Ask Poncho to research, write, or format; from a chat, “Save to
                Vault” drops the result into any folder.
              </li>
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
