"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";

export interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}

interface TreeItem extends TreeNode {
  children: TreeItem[];
  href: string;
}

const ROOT = "__root__";

/**
 * SidebarTree — Obsidian/Cursor-style nested tree.
 * Folders default COLLAPSED. Click a folder's name to OPEN it (navigate);
 * click the chevron to expand/collapse. Drag a node onto a folder (or the empty
 * area = top level) to MOVE it.
 */
export function SidebarTree({ nodes }: { nodes: TreeNode[] }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const roots = useMemo(() => buildTree(nodes), [nodes]);

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function move(nodeId: string, newParentId: string | null) {
    if (nodeId === newParentId) return;
    try {
      const res = await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      });
      if (res.ok) router.refresh();
    } catch {
      /* ignore — tree refreshes on next load */
    }
  }

  function endDrag() {
    setDragId(null);
    setOverId(null);
  }

  if (roots.length === 0) {
    return (
      <p className="px-2 py-1 text-xs leading-relaxed text-muted">
        No entries yet. Use <span className="text-accent-dim">+ New Entry</span>{" "}
        to start.
      </p>
    );
  }

  return (
    <ul
      className={`space-y-0.5 rounded-lg transition-colors ${
        overId === ROOT ? "bg-accent/5 ring-1 ring-accent-dim/50" : ""
      }`}
      onDragOver={(e) => {
        if (dragId) {
          e.preventDefault();
          setOverId(ROOT);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragId) move(dragId, null);
        endDrag();
      }}
    >
      {roots.map((item) => (
        <TreeRow
          key={item.id}
          item={item}
          depth={0}
          pathname={pathname}
          openIds={openIds}
          toggle={toggle}
          dragId={dragId}
          overId={overId}
          setDragId={setDragId}
          setOverId={setOverId}
          move={move}
          endDrag={endDrag}
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
  dragId,
  overId,
  setDragId,
  setOverId,
  move,
  endDrag,
}: {
  item: TreeItem;
  depth: number;
  pathname: string;
  openIds: Set<string>;
  toggle: (id: string) => void;
  dragId: string | null;
  overId: string | null;
  setDragId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
  move: (nodeId: string, parentId: string | null) => void;
  endDrag: () => void;
}) {
  const isFolder = item.kind === "folder";
  const open = openIds.has(item.id);
  const active =
    pathname === item.href || (isFolder && pathname.startsWith(item.href + "/"));
  const isDropTarget = isFolder && overId === item.id && dragId !== item.id;
  const indent = { paddingLeft: `${0.25 + depth * 0.7}rem` };

  const dragProps = {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      setDragId(item.id);
    },
    onDragEnd: endDrag,
  };

  const folderDropProps = isFolder
    ? {
        onDragOver: (e: React.DragEvent) => {
          if (dragId && dragId !== item.id) {
            e.preventDefault();
            e.stopPropagation();
            setOverId(item.id);
          }
        },
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (dragId && dragId !== item.id) move(dragId, item.id);
          endDrag();
        },
      }
    : {};

  const rowClass = `group flex items-center gap-1 rounded-lg py-1.5 pr-2 text-sm transition-colors ${
    isDropTarget
      ? "bg-accent/15 ring-1 ring-accent-dim"
      : active
        ? "bg-accent/10 text-accent-soft"
        : "text-muted hover:bg-surface-2 hover:text-text"
  }`;

  return (
    <li>
      <div
        style={indent}
        className={rowClass}
        {...dragProps}
        {...folderDropProps}
      >
        {isFolder ? (
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(item.id);
            }}
            className="shrink-0 rounded p-0.5 text-faint transition-colors hover:text-text"
          >
            <ChevronRight
              aria-hidden
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                open ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <span aria-hidden className="h-3.5 w-3.5 shrink-0" />
        )}

        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center gap-1.5"
        >
          {isFolder ? (
            open ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="truncate">{item.title}</span>
        </Link>
      </div>

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
              dragId={dragId}
              overId={overId}
              setDragId={setDragId}
              setOverId={setOverId}
              move={move}
              endDrag={endDrag}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function buildTree(nodes: TreeNode[]): TreeItem[] {
  const rawById = new Map(nodes.map((n) => [n.id, n] as const));

  const hrefFor = (node: TreeNode): string => {
    const path: string[] = [];
    let cur: TreeNode | undefined = node;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      path.unshift(cur.slug);
      cur = cur.parentId ? rawById.get(cur.parentId) : undefined;
    }
    return `/vault/${path.join("/")}`;
  };

  const itemById = new Map<string, TreeItem>();
  for (const n of nodes) {
    itemById.set(n.id, { ...n, children: [], href: hrefFor(n) });
  }

  const roots: TreeItem[] = [];
  for (const n of nodes) {
    const item = itemById.get(n.id)!;
    if (n.parentId && itemById.has(n.parentId)) {
      itemById.get(n.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}

export default SidebarTree;
