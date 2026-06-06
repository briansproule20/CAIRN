"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Sparkles,
  Trash2,
  X,
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

interface PonchoStep {
  kind: "reasoning" | "tool" | "text";
  text?: string;
  name?: string;
  state?: string;
  done?: boolean;
}

/** Make a raw tool name readable: "mcp__agentcash__search" -> "agentcash · search". */
function prettyTool(name?: string): string {
  if (!name) return "tool";
  return name.replace(/^mcp__/, "").replace(/__/g, " · ");
}

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

  const [enrichOpen, setEnrichOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichSteps, setEnrichSteps] = useState<PonchoStep[]>([]);
  const enrichLogRef = useRef<HTMLDivElement | null>(null);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [showMd, setShowMd] = useState(false);

  // Insert markdown around the selection (or a placeholder) at the cursor.
  function applyMarkdown(kind: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const put = (before: string, after: string, ph: string) => {
      const text = sel || ph;
      setContent(content.slice(0, start) + before + text + after + content.slice(end));
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + before.length, start + before.length + text.length);
      });
    };
    switch (kind) {
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

  // Load the enriched markdown into the editor for review (never auto-saves).
  function loadEnriched(result: string) {
    setTitle(initialTitle);
    setTags(initialTags.join(", "));
    setStatus(initialStatus);
    setContent(result);
    setEnrichOpen(false);
    setInstructions("");
    setEnrichSteps([]);
    setEditing(true);
  }

  // Parse one SSE frame ("event: …\ndata: …") from the enrich stream.
  function handleEnrichFrame(frame: string) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    let data: {
      status?: string;
      steps?: PonchoStep[];
      result?: string;
      partial?: string;
      error?: string;
    };
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }
    if (event === "progress") {
      if (Array.isArray(data.steps)) {
        // Show the trace — reasoning + tool calls (drop interstitial text).
        setEnrichSteps(data.steps.filter((s) => s.kind !== "text"));
        requestAnimationFrame(() => {
          enrichLogRef.current?.scrollTo({
            top: enrichLogRef.current.scrollHeight,
          });
        });
      }
    } else if (event === "done") {
      loadEnriched(data.result || "");
    } else if (event === "timeout") {
      setError(
        "Poncho ran past the time limit — here's what it produced so far."
      );
      if (data.partial) loadEnriched(data.partial);
    } else if (event === "error") {
      setError(data.error || "Poncho couldn't enrich that.");
    }
  }

  // Stream the enrich run so the author can watch Poncho work, then load the
  // result into the editor for review before saving.
  async function enrich() {
    if (enriching) return;
    setEnriching(true);
    setError("");
    setEnrichSteps([]);
    try {
      const res = await fetch("/api/poncho/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: initialContent, instructions }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Poncho couldn't enrich that.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) !== -1) {
          const frame = buf.slice(0, i);
          buf = buf.slice(i + 2);
          if (frame.trim()) handleEnrichFrame(frame);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Poncho couldn't enrich that.");
    } finally {
      setEnriching(false);
    }
  }

  if (!editing) {
    return (
      <>
        <article className="max-w-3xl">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-text">{initialTitle}</h1>
              <p className="mt-1 font-mono text-xs text-faint">{meta}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setInstructions("");
                  setEnrichSteps([]);
                  setEnrichOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent-dim/50 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:border-accent-dim hover:bg-accent/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Enrich
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:bg-accent/10 hover:text-accent-soft"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </header>
          {children}
        </article>

        {enrichOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm [animation:cairn-fade-in_140ms_ease-out]"
              onClick={() => !enriching && setEnrichOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Enrich with Poncho"
              className="relative z-10 w-full max-w-md rounded-2xl border border-border-strong bg-surface p-5 shadow-2xl shadow-black/60 [animation:cairn-rise-in_160ms_ease-out]"
            >
              <div className="mb-1 flex items-center gap-2 font-serif text-lg text-text">
                <Sparkles className="h-4 w-4 text-accent-dim" />
                Enrich with Poncho
              </div>
              <p className="mb-3 text-sm leading-relaxed text-muted">
                How would you like Poncho to enrich this entry?
              </p>
              <textarea
                autoFocus
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                disabled={enriching}
                placeholder="e.g. add historical context and a sources section, tighten the intro, expand the second half… (optional)"
                className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm leading-relaxed text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
              />

              {/* Live activity — watch Poncho work */}
              {(enriching || enrichSteps.length > 0) && (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface-2/60 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${
                        enriching ? "animate-pulse bg-accent" : "bg-accent-dim"
                      }`}
                    />
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
                      {enriching ? "Poncho is working" : "Trace"}
                    </span>
                  </div>
                  {enrichSteps.length > 0 && (
                    <div
                      ref={enrichLogRef}
                      className="max-h-40 space-y-1.5 overflow-y-auto pr-1"
                    >
                      {enrichSteps.map((s, i) =>
                        s.kind === "tool" ? (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-[0.6875rem] text-muted"
                          >
                            {s.done ? (
                              <span aria-hidden className="text-accent">
                                ✓
                              </span>
                            ) : (
                              <span
                                aria-hidden
                                className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent-dim/40 border-t-accent-dim"
                              />
                            )}
                            <span className="font-mono text-accent-soft">
                              {prettyTool(s.name)}
                            </span>
                            {!s.done && (
                              <span className="text-faint">running…</span>
                            )}
                          </div>
                        ) : (
                          <p
                            key={i}
                            className="border-l border-border-strong pl-2.5 text-[0.6875rem] italic leading-relaxed text-faint"
                          >
                            {s.text}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && <p className="mt-2 text-xs text-accent-soft">{error}</p>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEnrichOpen(false)}
                  disabled={enriching}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={enrich}
                  disabled={enriching}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {enriching ? "Enriching…" : "Enrich"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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
        rows={20}
        disabled={busy}
        placeholder="Write here — just plain text. Use “Add markdown” for headings, lists, links…"
        className="mb-4 block w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
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
