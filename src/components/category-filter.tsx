"use client";

import { useMemo, useState } from "react";
import type { VaultEntry } from "@/lib/vault";
import { EntryCard } from "@/components/entry-card";

/**
 * CategoryFilter — client-side controls for a single category's entries.
 *
 * Filters by tag and status, sorts by recently-updated or title, and renders
 * the resulting list with <EntryCard/>. The server page reads the entries from
 * the vault and passes them down; all filtering happens in the browser.
 */

type StatusFilter = "all" | "draft" | "published";
type SortKey = "updated" | "title";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "title", label: "Title" },
];

function dateOf(entry: VaultEntry): string {
  return entry.updated || entry.created || "";
}

export function CategoryFilter({ entries }: { entries: VaultEntry[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [entries]);

  const visible = useMemo(() => {
    let list = entries.slice();
    if (status !== "all") list = list.filter((e) => e.status === status);
    if (activeTag) {
      const t = activeTag.toLowerCase();
      list = list.filter((e) => e.tags.some((x) => x.toLowerCase() === t));
    }
    list.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : dateOf(b).localeCompare(dateOf(a))
    );
    return list;
  }, [entries, status, activeTag, sort]);

  const hasFilters = status !== "all" || activeTag !== null;

  const selectClasses =
    "rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-text transition-colors hover:border-border-strong";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Status segmented control */}
          <div className="flex items-center gap-2">
            <span
              id="status-label"
              className="font-mono text-[0.6875rem] uppercase tracking-wider text-faint"
            >
              Status
            </span>
            <div
              role="group"
              aria-labelledby="status-label"
              className="inline-flex rounded-lg border border-border bg-surface p-0.5"
            >
              {STATUS_OPTIONS.map((opt) => {
                const active = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                      active
                        ? "bg-accent/15 text-accent-soft"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="font-mono text-[0.6875rem] uppercase tracking-wider text-faint"
            >
              Sort
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectClasses}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-faint">
              Tags
            </span>
            {allTags.map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] lowercase tracking-tight transition-colors ${
                    active
                      ? "border-accent-dim/60 bg-accent/15 text-accent-soft"
                      : "border-border bg-surface-2/60 text-muted hover:border-border-strong hover:text-text"
                  }`}
                >
                  {tag}
                  <span className="text-faint">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result meta */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted">
          {visible.length} {visible.length === 1 ? "entry" : "entries"}
          {hasFilters && (
            <span className="text-faint"> of {entries.length}</span>
          )}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setActiveTag(null);
            }}
            className="font-mono text-xs text-accent transition-colors hover:text-accent-soft"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            No entries match the current filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((entry) => (
            <EntryCard key={`${entry.category}/${entry.slug}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryFilter;
