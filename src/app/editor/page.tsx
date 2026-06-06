"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const DRAFT_KEY = "cairn_draft";

function today() {
  return new Date().toISOString().split("T")[0];
}

function makeTemplate() {
  const d = today();
  return `---
title: Untitled
category:
tags: []
status: draft
created: ${d}
updated: ${d}
---

Start writing your entry here.

## Section

Use Markdown / MDX for headings, lists, and code. Frontmatter above is
parsed by the vault — set \`category\` and \`status: published\` when ready.
`;
}

type SaveState = "idle" | "dirty" | "saving" | "saved";

export default function EditorPage() {
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [formatError, setFormatError] = useState("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage (or template) on mount — avoids SSR mismatch.
  useEffect(() => {
    let initial = makeTemplate();
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (stored && stored.trim().length > 0) {
        initial = stored;
        setRestored(true);
      }
    } catch {
      /* localStorage unavailable — fall back to template */
    }
    setContent(initial);
    setReady(true);
  }, []);

  const persist = useCallback((value: string) => {
    setSaveState("saving");
    try {
      window.localStorage.setItem(DRAFT_KEY, value);
      setSaveState("saved");
    } catch {
      setSaveState("dirty");
    }
  }, []);

  function handleChange(value: string) {
    setContent(value);
    setRestored(false);
    setSaveState("dirty");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => persist(value), 1200);
  }

  function handleSaveNow() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    persist(content);
  }

  // Send raw notes to Poncho and replace the draft with clean MDX.
  async function handleFormatWithPoncho() {
    if (formatting || content.trim().length === 0) return;
    setFormatting(true);
    setFormatError("");
    try {
      const res = await fetch("/api/poncho/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Poncho couldn't format these notes.");
      }
      if (typeof data.markdown === "string" && data.markdown.trim()) {
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        setContent(data.markdown);
        setRestored(false);
        persist(data.markdown);
      } else {
        throw new Error("Poncho returned an empty response.");
      }
    } catch (err) {
      setFormatError(
        err instanceof Error ? err.message : "Formatting failed."
      );
    } finally {
      setFormatting(false);
    }
  }

  function handleReset() {
    if (
      content.trim().length > 0 &&
      !window.confirm("Replace the current draft with a fresh template?")
    ) {
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const tpl = makeTemplate();
    setContent(tpl);
    setRestored(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setSaveState("idle");
  }

  // Cmd/Ctrl+S saves the draft.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveNow();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // handleSaveNow closes over latest content via state; re-bind on content change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const words = content
    .replace(/^---[\s\S]*?---/, "") // drop frontmatter from the count
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const lines = content.split("\n").length;

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
            Draft Editor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} restored={restored} />
          <button
            type="button"
            onClick={handleFormatWithPoncho}
            disabled={formatting || content.trim().length === 0}
            title="Send your notes to Poncho and replace them with clean MDX"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-dim/50 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:border-accent-dim hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formatting ? (
              <span
                aria-hidden
                className="h-3 w-3 animate-spin rounded-full border-2 border-accent-soft/40 border-t-accent-soft"
              />
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9.5 2.5 11 6l3.5 1.5L11 9l-1.5 3.5L8 9l-3.5-1.5L8 6z" />
                <path d="M3.5 11.5 4 13l1.5.5L4 14l-.5 1.5L3 14l-1.5-.5L3 13z" />
              </svg>
            )}
            {formatting ? "Formatting…" : "Format with Poncho"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="hidden rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-text sm:inline-flex"
          >
            New template
          </button>
          <button
            type="button"
            onClick={handleSaveNow}
            disabled={saveState === "saved" || saveState === "idle"}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
          >
            Save draft
          </button>
        </div>
      </header>

      {/* Poncho error surface */}
      {formatError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 border-b border-accent-dim/40 bg-accent/[0.06] px-4 py-2 text-xs text-accent-soft sm:px-6"
        >
          <span className="leading-relaxed">{formatError}</span>
          <button
            type="button"
            onClick={() => setFormatError("")}
            aria-label="Dismiss"
            className="shrink-0 font-mono text-muted transition-colors hover:text-text"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editing surface */}
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1">
          {/* Gutter rail — quiet, archival */}
          <div
            aria-hidden
            className="hidden w-12 shrink-0 select-none border-r border-border bg-surface/40 pt-6 text-right font-mono text-xs leading-[1.7] text-faint sm:block"
          >
            {Array.from({ length: Math.min(lines, 999) }).map((_, i) => (
              <div key={i} className="pr-2">
                {i + 1}
              </div>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            disabled={!ready}
            aria-label="Entry content"
            placeholder={ready ? "" : "Loading draft…"}
            className="min-h-[60dvh] flex-1 resize-none bg-base px-5 py-6 font-mono text-sm leading-[1.7] text-text caret-accent outline-none transition-shadow placeholder:text-faint focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40 sm:px-6"
          />
        </div>
      </main>

      {/* Guidance footer */}
      <footer className="flex flex-col gap-2 border-t border-border bg-surface/60 px-4 py-2.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="leading-relaxed">
          Drafts autosave to this browser&apos;s local storage. To publish, copy
          the content into{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.6875rem] text-accent-soft">
            vault/[category]/[slug].mdx
          </code>{" "}
          or hand it to Claude Code.
        </p>
        <div className="flex shrink-0 items-center gap-3 font-mono text-[0.6875rem] text-faint">
          <span>{words} words</span>
          <span aria-hidden>·</span>
          <span>{lines} lines</span>
          <span aria-hidden>·</span>
          <span>
            <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 text-text">
              ⌘S
            </kbd>{" "}
            save
          </span>
        </div>
      </footer>
    </div>
  );
}

function SaveIndicator({
  state,
  restored,
}: {
  state: SaveState;
  restored: boolean;
}) {
  let label: string;
  let dotClass: string;

  switch (state) {
    case "saving":
      label = "Saving…";
      dotClass = "bg-accent-dim animate-pulse";
      break;
    case "saved":
      label = "Saved locally";
      dotClass = "bg-accent";
      break;
    case "dirty":
      label = "Unsaved changes";
      dotClass = "bg-faint";
      break;
    default:
      label = restored ? "Draft restored" : "Ready";
      dotClass = "bg-faint";
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted"
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
