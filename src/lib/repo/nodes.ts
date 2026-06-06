import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { nodes, links, type Node } from "@/lib/db/schema";

export type { Node };
export type NodeKind = "folder" | "entry";

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

/** Folders first, then by position, then title. */
const childOrder = [
  sql`case when ${nodes.kind} = 'folder' then 0 else 1 end`,
  asc(nodes.position),
  asc(nodes.title),
];

export async function getNode(
  ownerId: string,
  id: string
): Promise<Node | null> {
  const db = getDb();
  const [n] = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), eq(nodes.id, id)))
    .limit(1);
  return n ?? null;
}

export async function listChildren(
  ownerId: string,
  parentId: string | null
): Promise<Node[]> {
  const db = getDb();
  const parentCond =
    parentId === null ? isNull(nodes.parentId) : eq(nodes.parentId, parentId);
  return db
    .select()
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), parentCond))
    .orderBy(...childOrder);
}

/** Resolve a node from a slug path (e.g. ["music","albums"]). */
export async function getNodeBySlugPath(
  ownerId: string,
  slugs: string[]
): Promise<Node | null> {
  const db = getDb();
  let parentId: string | null = null;
  let node: Node | null = null;
  for (const slug of slugs) {
    const parentCond: SQL | undefined =
      parentId === null ? isNull(nodes.parentId) : eq(nodes.parentId, parentId);
    const [n] = await db
      .select()
      .from(nodes)
      .where(
        and(eq(nodes.ownerId, ownerId), parentCond, eq(nodes.slug, slug))
      )
      .limit(1);
    if (!n) return null;
    node = n;
    parentId = n.id;
  }
  return node;
}

/** Ancestors of a node, root → parent (for breadcrumbs). */
export async function breadcrumb(
  ownerId: string,
  node: Node
): Promise<Node[]> {
  if (!node.path.length) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), inArray(nodes.id, node.path)));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return node.path.map((id) => byId.get(id)).filter((n): n is Node => !!n);
}

export async function childCount(
  ownerId: string,
  id: string
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), eq(nodes.parentId, id)));
  return row?.n ?? 0;
}

export async function createNode(
  ownerId: string,
  input: {
    parentId?: string | null;
    kind?: NodeKind;
    title: string;
    slug?: string;
    content?: string;
    status?: string;
    tags?: string[];
  }
): Promise<Node> {
  const db = getDb();
  const parentId = input.parentId ?? null;
  let path: string[] = [];
  if (parentId) {
    const parent = await getNode(ownerId, parentId);
    if (!parent) throw new Error("Parent not found.");
    path = [...parent.path, parent.id];
  }
  const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);

  // Ensure slug is unique among siblings.
  const siblings = await listChildren(ownerId, parentId);
  const taken = new Set(siblings.map((s) => s.slug));
  let slug = baseSlug;
  let i = 2;
  while (taken.has(slug)) slug = `${baseSlug}-${i++}`;

  const [node] = await db
    .insert(nodes)
    .values({
      ownerId,
      parentId,
      kind: input.kind ?? "entry",
      title: input.title.trim(),
      slug,
      path,
      depth: path.length,
      content: input.content ?? "",
      tags: input.tags ?? [],
      status: input.status ?? "draft",
    })
    .returning();
  return node;
}

export async function updateNode(
  ownerId: string,
  id: string,
  patch: {
    title?: string;
    content?: string;
    status?: string;
    tags?: string[];
  }
): Promise<Node | null> {
  const db = getDb();
  const [node] = await db
    .update(nodes)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(nodes.ownerId, ownerId), eq(nodes.id, id)))
    .returning();
  return node ?? null;
}

/** Delete a node and its whole subtree (descendants reference it via path). */
export async function deleteNode(ownerId: string, id: string): Promise<void> {
  const db = getDb();
  await db
    .delete(nodes)
    .where(
      and(
        eq(nodes.ownerId, ownerId),
        or(eq(nodes.id, id), sql`${id} = any(${nodes.path})`)
      )
    );
}

/**
 * Move a node under a new parent (or to the top level when newParentId is null),
 * rewriting the node's path + every descendant's path. Rejects moving a folder
 * into itself or one of its own descendants.
 */
export async function moveNode(
  ownerId: string,
  id: string,
  newParentId: string | null
): Promise<void> {
  const db = getDb();
  const node = await getNode(ownerId, id);
  if (!node) throw new Error("Node not found.");
  if (newParentId === node.parentId) return; // no-op

  let newPath: string[] = [];
  if (newParentId) {
    if (newParentId === id) throw new Error("Can't move a folder into itself.");
    const parent = await getNode(ownerId, newParentId);
    if (!parent) throw new Error("Destination not found.");
    if (parent.path.includes(id)) {
      throw new Error("Can't move a folder into one of its own subfolders.");
    }
    newPath = [...parent.path, parent.id];
  }

  // Slug must stay unique among the destination's children.
  const siblings = await listChildren(ownerId, newParentId);
  if (siblings.some((s) => s.id !== id && s.slug === node.slug)) {
    throw new Error("An item with that name already exists there.");
  }

  // Descendants currently carry `id` somewhere in their path.
  const descendants = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), sql`${id} = any(${nodes.path})`));

  await db
    .update(nodes)
    .set({ parentId: newParentId, path: newPath, depth: newPath.length, updatedAt: new Date() })
    .where(and(eq(nodes.ownerId, ownerId), eq(nodes.id, id)));

  for (const d of descendants) {
    const idx = d.path.indexOf(id);
    const tail = idx >= 0 ? d.path.slice(idx) : d.path; // [id, ...between]
    const np = [...newPath, ...tail];
    await db
      .update(nodes)
      .set({ path: np, depth: np.length, updatedAt: new Date() })
      .where(and(eq(nodes.ownerId, ownerId), eq(nodes.id, d.id)));
  }
}

// --- cross-references ------------------------------------------------------

export interface BacklinkRef {
  id: string;
  title: string;
  slug: string;
}

export async function getBacklinks(
  ownerId: string,
  nodeId: string
): Promise<BacklinkRef[]> {
  const db = getDb();
  return db
    .select({ id: nodes.id, title: nodes.title, slug: nodes.slug })
    .from(links)
    .innerJoin(nodes, eq(links.sourceId, nodes.id))
    .where(and(eq(links.ownerId, ownerId), eq(links.targetId, nodeId)));
}

// --- search / tree / tags / dashboard --------------------------------------

export async function searchNodes(
  ownerId: string,
  q: string,
  limit = 24
): Promise<Node[]> {
  const db = getDb();
  const like = `%${q}%`;
  return db
    .select()
    .from(nodes)
    .where(
      and(
        eq(nodes.ownerId, ownerId),
        or(ilike(nodes.title, like), ilike(nodes.content, like))
      )
    )
    .orderBy(...childOrder)
    .limit(limit);
}

export interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}

/** Flat list of all of the owner's nodes — the client builds the tree. */
export async function getTree(ownerId: string): Promise<TreeNode[]> {
  const db = getDb();
  return db
    .select({
      id: nodes.id,
      parentId: nodes.parentId,
      slug: nodes.slug,
      title: nodes.title,
      kind: nodes.kind,
    })
    .from(nodes)
    .where(eq(nodes.ownerId, ownerId))
    .orderBy(...childOrder);
}

/** Resolve a node's full slug path (ancestors → self) for building /vault URLs. */
export async function slugPathFor(
  ownerId: string,
  node: { slug: string; path: string[] }
): Promise<string[]> {
  if (!node.path.length) return [node.slug];
  const db = getDb();
  const rows = await db
    .select({ id: nodes.id, slug: nodes.slug })
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), inArray(nodes.id, node.path)));
  const byId = new Map(rows.map((r) => [r.id, r.slug]));
  const ancestors = node.path
    .map((id) => byId.get(id))
    .filter((s): s is string => !!s);
  return [...ancestors, node.slug];
}

export async function getAllTags(
  ownerId: string
): Promise<{ tag: string; count: number }[]> {
  const db = getDb();
  const rows = await db
    .select({ tags: nodes.tags })
    .from(nodes)
    .where(eq(nodes.ownerId, ownerId));
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getNodesByTag(
  ownerId: string,
  tag: string
): Promise<Node[]> {
  const db = getDb();
  return db
    .select()
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), sql`${tag} = any(${nodes.tags})`))
    .orderBy(desc(nodes.updatedAt));
}

export async function recentNodes(ownerId: string, limit = 8): Promise<Node[]> {
  const db = getDb();
  return db
    .select()
    .from(nodes)
    .where(and(eq(nodes.ownerId, ownerId), eq(nodes.kind, "entry")))
    .orderBy(desc(nodes.updatedAt))
    .limit(limit);
}

export interface NodeStats {
  total: number;
  folders: number;
  entries: number;
  published: number;
}

export async function nodeStats(ownerId: string): Promise<NodeStats> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      folders: sql<number>`count(*) filter (where ${nodes.kind} = 'folder')::int`,
      entries: sql<number>`count(*) filter (where ${nodes.kind} = 'entry')::int`,
      published: sql<number>`count(*) filter (where ${nodes.status} = 'published')::int`,
    })
    .from(nodes)
    .where(eq(nodes.ownerId, ownerId));
  return row ?? { total: 0, folders: 0, entries: 0, published: 0 };
}
