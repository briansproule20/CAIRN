"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";

/**
 * CommandPalette — global search modal.
 *
 * CONTRACT (preserved from the Foundation stub):
 *  - Default export named `CommandPalette`, takes NO required props.
 *  - Rendered ONCE by <AppShell>; do not mount it elsewhere.
 *  - Opens on Cmd/Ctrl + K and on the window CustomEvent below.
 *  - Closes on Esc or backdrop click.
 *
 * The search-open event name, kept importable for triggers (e.g. Topbar):
 */
export const SEARCH_OPEN_EVENT = "cairn:open-search" as const;

/** Shape returned by GET /api/search. */
interface SearchResult {
  slug: string;
  category: string;
  title: string;
  tags: string[];
  status: string;
  snippet: string;
  matchedTitle: boolean;
}

interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

const DEBOUNCE_MS = 160;

/** Format a category slug ("head-canon") into a readable label ("head canon"). */
function categoryLabel(category: string): string {
  return category.replace(/-/g, " ");
}

/**
 * Highlight occurrences of `query` within `text` using the accent color.
 * Case-insensitive, returns plain text untouched when there is no match.
 */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let from = lower.indexOf(needle);

  if (from === -1) return text;

  let key = 0;
  while (from !== -1) {
    if (from > cursor) parts.push(text.slice(cursor, from));
    parts.push(
      <mark
        key={key++}
        className="rounded-[0.1875rem] bg-accent/15 px-0.5 text-accent-soft"
      >
        {text.slice(from, from + needle.length)}
      </mark>
    );
    cursor = from + needle.length;
    from = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebounced("");
    setResults([]);
    setTotalCount(0);
    setError(false);
    setActive(0);
  }, []);

  // Cmd/Ctrl+K toggles, Esc closes, custom event opens.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(SEARCH_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
    };
  }, []);

  // Reset transient state each time the palette opens; focus the input + lock scroll.
  useEffect(() => {
    if (!open) {
      // Clear query when fully closed so the next open starts fresh.
      setQuery("");
      setDebounced("");
      setResults([]);
      setTotalCount(0);
      setError(false);
      setActive(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounce the query.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  // Fetch results for the debounced query.
  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      setError(false);
      setActive(0);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    fetch(`/api/search?q=${encodeURIComponent(debounced)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        return res.json() as Promise<SearchResponse>;
      })
      .then((data) => {
        setResults(data.results);
        setTotalCount(data.count);
        setActive(0);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setTotalCount(0);
        setError(true);
      })
      .finally(() => {
        // Ignore the loading reset for an aborted request.
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced, open]);

  const href = useCallback(
    (r: SearchResult) => `/vault/${r.category}/${r.slug}`,
    []
  );

  const go = useCallback(
    (r: SearchResult) => {
      router.push(href(r));
      close();
    },
    [router, href, close]
  );

  // Keep the active row scrolled into view.
  useEffect(() => {
    if (!open || results.length === 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active, results.length, open]);

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const r = results[active];
        if (r) go(r);
      }
    },
    [results, active, go]
  );

  const hasQuery = debounced.length > 0;
  const showResults = hasQuery && !loading && !error && results.length > 0;
  const showNoResults =
    hasQuery && !loading && !error && results.length === 0;

  const activeOptionId = useMemo(
    () => (showResults ? `${listboxId}-opt-${active}` : undefined),
    [showResults, listboxId, active]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the archive"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm [animation:cairn-fade-in_150ms_ease-out]"
      />

      {/* panel — note: NOT overflow-hidden, so the input's focus ring is
          never clipped at the rounded top edge. Children that need their
          own corners rounded (the scroll region / footer) handle it
          themselves. */}
      <div className="relative w-full max-w-xl rounded-2xl border border-border-strong bg-surface shadow-2xl shadow-black/60 [animation:cairn-rise-in_180ms_ease-out]">
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-border px-4 focus-within:ring-2 focus-within:ring-accent/60">
          {loading ? (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 animate-spin text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search entries, tags, content…"
            aria-label="Search query"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showResults}
            aria-controls={showResults ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            className="w-full bg-transparent py-4 text-[0.95rem] text-text placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted sm:inline">
            Esc
          </kbd>
        </div>

        {/* results region */}
        <div className="max-h-[55vh] overflow-y-auto rounded-b-2xl p-2">
          {/* idle */}
          {!hasQuery && (
            <p className="px-3 py-10 text-center font-mono text-xs text-faint">
              Type to search the archive.
            </p>
          )}

          {/* loading (only when there's nothing to show yet) */}
          {hasQuery && loading && results.length === 0 && (
            <p
              className="px-3 py-10 text-center font-mono text-xs text-faint"
              role="status"
              aria-live="polite"
            >
              Searching…
            </p>
          )}

          {/* error */}
          {hasQuery && error && (
            <p
              className="px-3 py-10 text-center font-mono text-xs text-accent-dim"
              role="alert"
            >
              Something went wrong. Try again.
            </p>
          )}

          {/* no results */}
          {showNoResults && (
            <div className="px-3 py-10 text-center">
              <p className="font-mono text-xs text-faint">
                No matches for{" "}
                <span className="text-muted">
                  &ldquo;{debounced}&rdquo;
                </span>
                .
              </p>
            </div>
          )}

          {/* results */}
          {showResults && (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="flex flex-col gap-1"
            >
              {results.map((r, i) => {
                const isActive = i === active;
                return (
                  <li key={`${r.category}/${r.slug}`} role="presentation">
                    <Link
                      id={`${listboxId}-opt-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isActive}
                      href={href(r)}
                      onClick={close}
                      onMouseMove={() => setActive(i)}
                      tabIndex={-1}
                      className={`block rounded-lg border px-3 py-2.5 transition-colors ${
                        isActive
                          ? "border-border-strong bg-surface-2"
                          : "border-transparent hover:bg-surface-2/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 flex-1 truncate font-serif text-[0.95rem] text-text">
                          {highlight(r.title, debounced)}
                        </span>
                        <Badge variant="status" className="shrink-0">
                          {r.status}
                        </Badge>
                      </div>

                      {r.snippet && (
                        <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-snug text-muted">
                          {highlight(r.snippet, debounced)}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center gap-2 font-mono text-[0.6875rem] text-faint">
                        <span className="lowercase tracking-tight text-accent-dim">
                          {categoryLabel(r.category)}
                        </span>
                        {r.tags.length > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="min-w-0 truncate">
                              {r.tags.slice(0, 3).join(" · ")}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* footer hints */}
        {showResults && (
          <div className="flex items-center justify-between rounded-b-2xl border-t border-border px-4 py-2 font-mono text-[0.625rem] text-faint">
            <span aria-live="polite">
              {totalCount} result{totalCount === 1 ? "" : "s"}
              {totalCount > results.length && ` · showing ${results.length}`}
            </span>
            <span className="hidden items-center gap-3 sm:flex">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5">
                  ↑
                </kbd>
                <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5">
                  ↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5">
                  ↵
                </kbd>
                open
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommandPalette;
