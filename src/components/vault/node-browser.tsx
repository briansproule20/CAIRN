"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Folder,
  FolderOpen,
  FileText,
  LayoutGrid,
  List,
  ListTree,
  ChevronRight,
} from "lucide-react";
import { NodeGrid, type NodeCard } from "@/components/vault/node-grid";

const STORAGE_KEY = "cairn:vault-view";
type View = "grid" | "list" | "tree";

interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}
interface TItem extends TreeNode {
  children: TItem[];
  href: string;
}

/**
 * NodeBrowser — view toggle for a folder's contents: card grid, compact list,
 * or an expandable tree (browse subfolders inline without leaving the page).
 * The tree view appears only when a `subtree` is provided. View persists in
 * localStorage.
 */
export function NodeBrowser({
  items,
  basePath,
  subtree,
}: {
  items: NodeCard[];
  basePath: string;
  subtree?: TreeNode[];
}) {
  const hasTree = !!subtree && subtree.length > 0;
  const [view, setView] = useState<View>("grid");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "grid" || saved === "list" || saved === "tree") {
      setView(saved === "tree" && !hasTree ? "grid" : saved);
    }
    setReady(true);
  }, [hasTree]);

  function choose(next: View) {
    setView(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const roots = useMemo(
    () => (hasTree ? buildSubtree(subtree!, basePath) : []),
    [subtree, basePath, hasTree]
  );

  const options = [
    { v: "grid" as const, Icon: LayoutGrid, label: "Card view" },
    { v: "list" as const, Icon: List, label: "List view" },
    ...(hasTree
      ? [{ v: "tree" as const, Icon: ListTree, label: "Tree view" }]
      : []),
  ];

  const effectiveView = !ready ? "grid" : view;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <div
          role="group"
          aria-label="View"
          className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
        >
          {options.map(({ v, Icon, label }) => (
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

      {effectiveView === "grid" && <NodeGrid items={items} basePath={basePath} />}

      {effectiveView === "list" && (
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
                    : "entry"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {effectiveView === "tree" && (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface p-1.5">
          {roots.map((item) => (
            <TreeRow key={item.id} item={item} depth={0} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TreeRow({ item, depth }: { item: TItem; depth: number }) {
  const isFolder = item.kind === "folder";
  const [open, setOpen] = useState(false);
  const indent = { paddingLeft: `${0.5 + depth * 0.9}rem` };

  return (
    <li>
      <div
        style={indent}
        className="group flex items-center gap-1 rounded-lg py-1.5 pr-2 transition-colors hover:bg-accent/[0.04]"
      >
        {isFolder ? (
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 rounded p-0.5 text-faint transition-colors hover:text-text"
          >
            <ChevronRight
              aria-hidden
              className={`h-4 w-4 transition-transform duration-150 ${
                open ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <span aria-hidden className="h-4 w-4 shrink-0" />
        )}

        <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-accent-dim transition-colors group-hover:text-accent">
            {isFolder ? (
              open ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0 truncate font-serif text-[0.95rem] text-text transition-colors group-hover:text-accent-soft">
            {item.title}
          </span>
          {isFolder && (
            <span className="ml-auto shrink-0 pl-2 font-mono text-[0.625rem] text-faint">
              {item.children.length}
            </span>
          )}
        </Link>
      </div>

      {isFolder && open && item.children.length > 0 && (
        <ul className="[animation:cairn-fade-in_140ms_ease-out]">
          {item.children.map((child) => (
            <TreeRow key={child.id} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Build the nested tree rooted at the current folder's direct children. */
function buildSubtree(nodes: TreeNode[], basePath: string): TItem[] {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const inSet = new Set(nodes.map((n) => n.id));

  const hrefFor = (n: TreeNode): string => {
    const slugs: string[] = [];
    let cur: TreeNode | undefined = n;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      slugs.unshift(cur.slug);
      cur =
        cur.parentId && inSet.has(cur.parentId)
          ? byId.get(cur.parentId)
          : undefined;
    }
    return `${basePath}/${slugs.map(encodeURIComponent).join("/")}`;
  };

  const itemById = new Map<string, TItem>();
  for (const n of nodes) {
    itemById.set(n.id, { ...n, children: [], href: hrefFor(n) });
  }
  const roots: TItem[] = [];
  for (const n of nodes) {
    const item = itemById.get(n.id)!;
    if (n.parentId && inSet.has(n.parentId)) {
      itemById.get(n.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}

export default NodeBrowser;
