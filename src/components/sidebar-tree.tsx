"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";

export interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}

/** A node enriched with its children and full slug path (root → self). */
interface TreeItem extends TreeNode {
  children: TreeItem[];
  slugPath: string[];
  href: string;
}

/**
 * SidebarTree — Obsidian/Cursor-style nested file tree.
 *
 * Receives the FLAT, folders-first node list from the server, reconstructs the
 * hierarchy on the client, and renders a recursive collapsible tree. Folders
 * toggle open/closed (chevron + Folder/FolderOpen); entries are leaves
 * (FileText) that navigate to their /vault/<slugpath> URL. The node matching
 * the current pathname is highlighted, and its ancestors auto-expand on load.
 */
export function SidebarTree({ nodes }: { nodes: TreeNode[] }) {
  const pathname = usePathname() ?? "";

  // Build the tree + per-node slug path from the flat list.
  const { roots, byHref } = useMemo(() => buildTree(nodes), [nodes]);

  // Ancestors of the active node — used to seed the open-folder set on load.
  const activeAncestors = useMemo(() => {
    const open = new Set<string>();
    // Find the deepest node whose href is a prefix of (or equal to) the path.
    let match: TreeItem | null = null;
    for (const item of byHref.values()) {
      if (
        pathname === item.href ||
        pathname.startsWith(item.href + "/")
      ) {
        if (!match || item.slugPath.length > match.slugPath.length) {
          match = item;
        }
      }
    }
    if (match) {
      // Walk up via parentId, collecting folder ids to expand.
      const byId = new Map(nodes.map((n) => [n.id, n] as const));
      let pid = match.parentId;
      while (pid) {
        open.add(pid);
        pid = byId.get(pid)?.parentId ?? null;
      }
      // If the active node itself is a folder, open it too.
      if (match.kind === "folder") open.add(match.id);
    }
    return open;
  }, [nodes, byHref, pathname]);

  const [openIds, setOpenIds] = useState<Set<string>>(activeAncestors);

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (roots.length === 0) {
    return (
      <p className="px-2 py-1 text-xs leading-relaxed text-muted">
        No entries yet. Use{" "}
        <span className="text-accent-dim">+ New Entry</span> to start.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {roots.map((item) => (
        <TreeRow
          key={item.id}
          item={item}
          depth={0}
          pathname={pathname}
          openIds={openIds}
          toggle={toggle}
        />
      ))}
    </ul>
  );
}

function TreeRow({
  item,
  depth,
  pathname,
  openIds,
  toggle,
}: {
  item: TreeItem;
  depth: number;
  pathname: string;
  openIds: Set<string>;
  toggle: (id: string) => void;
}) {
  const isFolder = item.kind === "folder";
  const open = openIds.has(item.id);
  const active =
    pathname === item.href ||
    (isFolder && pathname.startsWith(item.href + "/"));

  // Indent each level; depth 0 has the base padding.
  const indent = { paddingLeft: `${0.5 + depth * 0.75}rem` };

  const rowClass = `group flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition-colors ${
    active
      ? "bg-accent/10 text-accent-soft"
      : "text-muted hover:bg-surface-2 hover:text-text"
  }`;

  return (
    <li>
      {isFolder ? (
        <button
          type="button"
          onClick={() => toggle(item.id)}
          aria-expanded={open}
          style={indent}
          className={rowClass}
        >
          <ChevronRight
            aria-hidden
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
              open ? "rotate-90" : ""
            }`}
          />
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="truncate">{item.title}</span>
        </button>
      ) : (
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          style={indent}
          className={rowClass}
        >
          {/* Spacer aligns leaves under the chevron column. */}
          <span aria-hidden className="h-3.5 w-3.5 shrink-0" />
          <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{item.title}</span>
        </Link>
      )}

      {isFolder && open && item.children.length > 0 && (
        <ul className="space-y-0.5">
          {item.children.map((child) => (
            <TreeRow
              key={child.id}
              item={child}
              depth={depth + 1}
              pathname={pathname}
              openIds={openIds}
              toggle={toggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Reconstruct the hierarchy from the flat, folders-first list. Computes each
 * node's slug path by walking parentId to the root, preserving input order.
 */
function buildTree(nodes: TreeNode[]): {
  roots: TreeItem[];
  byHref: Map<string, TreeItem>;
} {
  const rawById = new Map(nodes.map((n) => [n.id, n] as const));

  const slugPathFor = (node: TreeNode): string[] => {
    const path: string[] = [];
    let cur: TreeNode | undefined = node;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      path.unshift(cur.slug);
      cur = cur.parentId ? rawById.get(cur.parentId) : undefined;
    }
    return path;
  };

  const itemById = new Map<string, TreeItem>();
  for (const n of nodes) {
    const slugPath = slugPathFor(n);
    itemById.set(n.id, {
      ...n,
      children: [],
      slugPath,
      href: `/vault/${slugPath.join("/")}`,
    });
  }

  const roots: TreeItem[] = [];
  const byHref = new Map<string, TreeItem>();
  for (const n of nodes) {
    const item = itemById.get(n.id)!;
    byHref.set(item.href, item);
    if (n.parentId && itemById.has(n.parentId)) {
      itemById.get(n.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  }

  return { roots, byHref };
}

export default SidebarTree;
