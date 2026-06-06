import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getNodesByTag, slugPathFor } from "@/lib/repo/nodes";

export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const ownerId = await getCurrentUserId();
  const nodes = ownerId ? await getNodesByTag(ownerId, tag) : [];
  if (nodes.length === 0) notFound();

  const items = await Promise.all(
    nodes.map(async (n) => ({
      title: n.title,
      kind: n.kind,
      href:
        "/vault/" +
        (await slugPathFor(ownerId!, n)).map(encodeURIComponent).join("/"),
    }))
  );

  return (
    <AppShell
      title={
        <span className="inline-flex items-center gap-2">
          <span className="text-faint">#</span>
          <span className="lowercase">{tag}</span>
        </span>
      }
      breadcrumb={
        <Link
          href="/tags"
          className="text-muted transition-colors hover:text-text"
        >
          Tags
        </Link>
      }
    >
      <header className="mb-8 space-y-2">
        <h1 className="font-serif text-3xl lowercase text-text">
          <span className="text-accent-dim">#</span>
          {tag}
        </h1>
        <p className="font-mono text-xs text-muted">
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </p>
      </header>

      <div className="grid gap-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent-dim hover:bg-accent/[0.03]"
          >
            <span className="truncate font-serif text-text">{it.title}</span>
            <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-faint">
              {it.kind}
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
