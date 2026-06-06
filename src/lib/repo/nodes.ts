import { and, asc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
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
      status: input.status ?? "draft",
    })
    .returning();
  return node;
}

export async function updateNode(
  ownerId: string,
  id: string,
  patch: { title?: string; content?: string; status?: string }
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
