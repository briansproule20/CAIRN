import Link from "next/link";
import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import { AppShell } from "@/components/app-shell";
import { MDXContent } from "@/components/mdx-content";
import { type NodeCard } from "@/components/vault/node-grid";
import { NodeBrowser } from "@/components/vault/node-browser";
import { CreateNode } from "@/components/vault/create-node";
import { EntryEditor } from "@/components/vault/entry-editor";
import { NodeMedia } from "@/components/vault/node-media";
import { FolderActions } from "@/components/vault/folder-actions";
import { FolderTitle } from "@/components/vault/folder-title";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  getNodeBySlugPath,
  listChildren,
  childCount,
  breadcrumb,
  getSubtree,
} from "@/lib/repo/nodes";

export const dynamic = "force-dynamic";

export default async function NodePathPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const ownerId = await getCurrentUserId();
  if (!ownerId) notFound();

  const node = await getNodeBySlugPath(ownerId, path);
  if (!node) notFound();

  const crumbs = await breadcrumb(ownerId, node);
  const basePath = "/vault/" + path.map(encodeURIComponent).join("/");

  const breadcrumbEl = (
    <span className="flex flex-wrap items-center gap-1.5">
      <Link href="/vault" className="text-muted transition-colors hover:text-text">
        Vault
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className="text-faint">/</span>
          <Link
            href={"/vault/" + path.slice(0, i + 1).map(encodeURIComponent).join("/")}
            className="text-muted transition-colors hover:text-text"
          >
            {c.title}
          </Link>
        </span>
      ))}
    </span>
  );

  if (node.kind === "folder") {
    const children = await listChildren(ownerId, node.id);
    const items: NodeCard[] = await Promise.all(
      children.map(async (c) => ({
        slug: c.slug,
        title: c.title,
        kind: c.kind as "folder" | "entry",
        count: c.kind === "folder" ? await childCount(ownerId, c.id) : undefined,
        status: c.status,
        mediaUrl: c.mediaUrl,
        mediaType: c.mediaType,
      }))
    );
    const overview = node.content?.trim()
      ? await serialize(node.content).catch(() => null)
      : null;
    // Subtree powers the inline tree view — only offered when there are
    // nested folders to expand.
    const subtree = await getSubtree(ownerId, node.id);
    const hasSubfolders = subtree.some((n) => n.kind === "folder");

    return (
      <AppShell title={node.title} breadcrumb={breadcrumbEl}>
        <header className="mb-8 flex items-start justify-between gap-4">
          <FolderTitle id={node.id} title={node.title} />
          <div className="flex shrink-0 items-center gap-2">
            <CreateNode parentId={node.id} />
            <FolderActions
              id={node.id}
              parentPath={
                path.length > 1
                  ? "/vault/" +
                    path.slice(0, -1).map(encodeURIComponent).join("/")
                  : "/vault"
              }
              title={node.title}
            />
          </div>
        </header>
        {overview && (
          <div className="prose-cairn mb-10 max-w-3xl">
            <MDXContent source={overview} />
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-sm text-muted">
            Empty folder. Use <span className="text-accent-dim">New</span> to add
            a folder or entry.
          </p>
        ) : (
          <NodeBrowser
            items={items}
            basePath={basePath}
            subtree={hasSubfolders ? subtree : undefined}
          />
        )}
      </AppShell>
    );
  }

  // entry
  const source = await serialize(node.content || "").catch(() => null);
  const parentPath =
    path.length > 1
      ? "/vault/" + path.slice(0, -1).map(encodeURIComponent).join("/")
      : "/vault";

  return (
    <AppShell title={node.title} breadcrumb={breadcrumbEl}>
      <EntryEditor
        id={node.id}
        parentPath={parentPath}
        title={node.title}
        content={node.content || ""}
        tags={node.tags ?? []}
        status={node.status}
        meta={
          <>
            {node.status} · updated {String(node.updatedAt).slice(0, 10)}
          </>
        }
      >
        {node.mediaUrl && (
          <div className="mb-6">
            <NodeMedia
              url={node.mediaUrl}
              mediaType={node.mediaType}
              title={node.title}
            />
          </div>
        )}
        {node.content?.trim() ? (
          source ? (
            <div className="prose-cairn">
              <MDXContent source={source} />
            </div>
          ) : (
            <pre className="overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface px-4 py-4 font-mono text-[0.8125rem] leading-relaxed text-text">
              {node.content}
            </pre>
          )
        ) : (
          <p className="text-sm text-muted">
            This entry is empty. Edit it to add content.
          </p>
        )}
      </EntryEditor>
    </AppShell>
  );
}
