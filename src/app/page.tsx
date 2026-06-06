import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { EmptyVault } from "@/components/dashboard/empty-vault";
import { NodeGrid, type NodeCard } from "@/components/vault/node-grid";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  nodeStats,
  recentNodes,
  listChildren,
  childCount,
  slugPathFor,
} from "@/lib/repo/nodes";

export const dynamic = "force-dynamic";

function PonchoBanner() {
  return (
    <Link
      href="/poncho"
      className="group mt-14 flex items-center gap-4 rounded-2xl border border-accent-dim/40 bg-accent/[0.05] px-5 py-4 transition-colors hover:border-accent-dim hover:bg-accent/[0.08]"
    >
      <Image src="/poncho-mark.svg" alt="" width={40} height={42} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg text-text">Ask Poncho</p>
        <p className="mt-0.5 text-sm text-muted">
          Research a topic · write copy · format notes into a vault entry
        </p>
      </div>
      <span
        aria-hidden
        className="shrink-0 text-accent-dim transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-soft"
      >
        →
      </span>
    </Link>
  );
}

function fmt(value: Date | string | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HomePage() {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return null;

  const [stats, recent, tops] = await Promise.all([
    nodeStats(ownerId),
    recentNodes(ownerId, 6),
    listChildren(ownerId, null),
  ]);

  if (stats.total === 0) {
    return (
      <AppShell title="Vault">
        <header className="mb-8">
          <h1 className="font-serif text-3xl text-text">The Cairn</h1>
          <p className="mt-1 text-sm text-muted">
            A quiet, private archive of records and notes.
          </p>
        </header>
        <EmptyVault />
        <PonchoBanner />
      </AppShell>
    );
  }

  const topCards: NodeCard[] = await Promise.all(
    tops.map(async (t) => ({
      slug: t.slug,
      title: t.title,
      kind: t.kind as "folder" | "entry",
      count: t.kind === "folder" ? await childCount(ownerId, t.id) : undefined,
      status: t.status,
    }))
  );

  const recentItems = await Promise.all(
    recent.map(async (r) => ({
      title: r.title,
      updated: fmt(r.updatedAt),
      href:
        "/vault/" +
        (await slugPathFor(ownerId, r)).map(encodeURIComponent).join("/"),
    }))
  );

  return (
    <AppShell title="Vault">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-text">The Cairn</h1>
        <p className="mt-1 text-sm text-muted">
          A quiet, private archive of records and notes.
        </p>
      </header>

      <section aria-label="Vault overview" className="mb-12">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Entries" value={stats.entries} hint="records" />
          <StatTile label="Folders" value={stats.folders} hint="sections" />
          <StatTile
            label="Published"
            value={
              <span className="flex items-baseline gap-1">
                {stats.published}
                <span className="font-mono text-base text-faint">
                  / {stats.entries}
                </span>
              </span>
            }
            hint={`${stats.entries - stats.published} drafts`}
          />
          <StatTile label="Total nodes" value={stats.total} hint="all" />
        </dl>
      </section>

      {recentItems.length > 0 && (
        <section className="mb-12">
          <SectionHeading
            title="Recently updated"
            count={recentItems.length}
            action={{ href: "/vault", label: "Open vault" }}
          />
          <div className="grid gap-2">
            {recentItems.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent-dim hover:bg-accent/[0.03]"
              >
                <span className="truncate font-serif text-text">{e.title}</span>
                <span className="shrink-0 font-mono text-[0.6875rem] text-faint">
                  {e.updated}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Browse by section" count={topCards.length} />
        <NodeGrid items={topCards} basePath="/vault" />
      </section>

      <PonchoBanner />
    </AppShell>
  );
}
