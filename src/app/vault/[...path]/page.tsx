import Link from "next/link";
import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import { AppShell } from "@/components/app-shell";
import { MDXContent } from "@/components/mdx-content";
import { NodeGrid, type NodeCard } from "@/components/vault/node-grid";
import { CreateNode } from "@/components/vault/create-node";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  getNodeBySlugPath,
  listChildren,
  childCount,
  breadcrumb,
  getBacklinks,
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
      }))
    );
    const overview = node.content?.trim()
      ? await serialize(node.content).catch(() => null)
      : null;

    return (
      <AppShell title={node.title} breadcrumb={breadcrumbEl}>
        <header className="mb-8 flex items-start justify-between gap-4">
          <h1 className="font-serif text-3xl text-text">{node.title}</h1>
          <CreateNode parentId={node.id} />
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
          <NodeGrid items={items} basePath={basePath} />
        )}
      </AppShell>
    );
  }

  // entry
  const backlinks = await getBacklinks(ownerId, node.id);
  const source = await serialize(node.content || "").catch(() => null);

  return (
    <AppShell title={node.title} breadcrumb={breadcrumbEl}>
      <article className="max-w-3xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl text-text">{node.title}</h1>
          <p className="mt-1 font-mono text-xs text-faint">
            {node.status} · updated {String(node.updatedAt).slice(0, 10)}
          </p>
        </header>

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

        {backlinks.length > 0 && (
          <section className="mt-12 border-t border-border pt-6">
            <h2 className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
              Referenced by
            </h2>
            <ul className="space-y-1">
              {backlinks.map((b) => (
                <li key={b.id} className="text-sm text-accent-soft">
                  {b.title}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </AppShell>
  );
}
