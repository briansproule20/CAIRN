"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, FileText, LayoutGrid, List } from "lucide-react";
import { NodeGrid, type NodeCard } from "@/components/vault/node-grid";

const STORAGE_KEY = "cairn:vault-view";
type View = "grid" | "list";

/**
 * NodeBrowser — owns the card↔list view toggle for a set of vault nodes.
 * Card view delegates to the existing `NodeGrid`; list view renders compact
 * rows (icon + title + count/kind). The chosen view persists in localStorage.
 */
export function NodeBrowser({
  items,
  basePath,
}: {
  items: NodeCard[];
  basePath: string;
}) {
  const [view, setView] = useState<View>("grid");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "grid" || saved === "list") setView(saved);
    setReady(true);
  }, []);

  function choose(next: View) {
    setView(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <div
          role="group"
          aria-label="View"
          className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
        >
          {(
            [
              { v: "grid" as const, Icon: LayoutGrid, label: "Card view" },
              { v: "list" as const, Icon: List, label: "List view" },
            ]
          ).map(({ v, Icon, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => choose(v)}
              aria-label={label}
              aria-pressed={view === v}
              className={`inline-flex items-center rounded-md px-2 py-1 transition-colors ${
                view === v
                  ? "bg-accent/15 text-accent-soft"
                  : "text-muted hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Avoid a flash of the wrong view before localStorage is read. */}
      {!ready ? (
        <NodeGrid items={items} basePath={basePath} />
      ) : view === "grid" ? (
        <NodeGrid items={items} basePath={basePath} />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface">
          {items.map((it) => (
            <li key={it.slug}>
              <Link
                href={`${basePath}/${it.slug}`}
                className="group flex items-center gap-3 border-b border-border px-4 py-2.5 transition-colors last:border-b-0 hover:bg-accent/[0.04]"
              >
                <span className="shrink-0 text-accent-dim transition-colors group-hover:text-accent">
                  {it.kind === "folder" ? (
                    <Folder className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-serif text-[0.95rem] text-text transition-colors group-hover:text-accent-soft">
                  {it.title}
                </span>
                <span className="shrink-0 font-mono text-[0.6875rem] text-faint">
                  {it.kind === "folder"
                    ? `${it.count ?? 0} ${it.count === 1 ? "item" : "items"}`
                    : it.status ?? "entry"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NodeBrowser;
