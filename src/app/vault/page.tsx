import { AppShell } from "@/components/app-shell";
import { type NodeCard } from "@/components/vault/node-grid";
import { NodeBrowser } from "@/components/vault/node-browser";
import { CreateNode } from "@/components/vault/create-node";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listChildren, childCount } from "@/lib/repo/nodes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vault · CAIRN" };

export default async function VaultPage() {
  const ownerId = await getCurrentUserId();
  const children = ownerId ? await listChildren(ownerId, null) : [];
  const items: NodeCard[] = await Promise.all(
    children.map(async (c) => ({
      slug: c.slug,
      title: c.title,
      kind: c.kind as "folder" | "entry",
      count:
        ownerId && c.kind === "folder"
          ? await childCount(ownerId, c.id)
          : undefined,
      status: c.status,
    }))
  );

  return (
    <AppShell title="Vault">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-text">Vault</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {items.length} top-level{" "}
            {items.length === 1 ? "section" : "sections"}
          </p>
        </div>
        <CreateNode parentId={null} />
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
          <h2 className="font-serif text-2xl text-text">Your vault is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Build a nested archive — create a top-level folder (Music, Books,
            Games…), then nest folders and entries inside. Use{" "}
            <span className="text-accent-dim">New</span> above to begin.
          </p>
        </div>
      ) : (
        <NodeBrowser items={items} basePath="/vault" />
      )}
    </AppShell>
  );
}
