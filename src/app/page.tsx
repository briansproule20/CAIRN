import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { EntryCard } from "@/components/entry-card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryCard } from "@/components/dashboard/category-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { EmptyVault } from "@/components/dashboard/empty-vault";
import {
  getAllEntries,
  getCategories,
  type VaultEntry,
} from "@/lib/vault";

/** Poncho call-to-action — links to the research/write/format workspace. */
function PonchoBanner() {
  return (
    <Link
      href="/poncho"
      className="group mt-14 flex items-center gap-4 rounded-2xl border border-accent-dim/40 bg-accent/[0.05] px-5 py-4 transition-colors hover:border-accent-dim hover:bg-accent/[0.08]"
    >
      <Image
        src="/poncho-mark.svg"
        alt=""
        width={40}
        height={42}
        className="shrink-0"
      />
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

/** Latest of updated/created, used for recency sorting. */
function entryDate(e: VaultEntry): string {
  return e.updated || e.created || "";
}

/** Format an ISO-ish date string for compact display; falls back gracefully. */
function formatDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage() {
  const categories = getCategories();
  const entries = getAllEntries();

  if (entries.length === 0) {
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

  // --- At-a-glance stats -----------------------------------------------------
  const total = entries.length;
  const tagSet = new Set<string>();
  let published = 0;
  for (const e of entries) {
    for (const t of e.tags) tagSet.add(t.toLowerCase());
    if (e.status?.toLowerCase() === "published") published += 1;
  }
  const drafts = total - published;

  const sortedByRecency = [...entries].sort((a, b) =>
    entryDate(b).localeCompare(entryDate(a))
  );
  const mostRecentDate = entryDate(sortedByRecency[0]);
  const recent = sortedByRecency.slice(0, 6);

  // --- Per-category counts (preserve sorted category order) ------------------
  const categoryStats = categories.map((name) => {
    const inCat = entries.filter((e) => e.category === name);
    return {
      name,
      count: inCat.length,
      published: inCat.filter((e) => e.status?.toLowerCase() === "published")
        .length,
    };
  });

  return (
    <AppShell title="Vault">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-text">The Cairn</h1>
        <p className="mt-1 text-sm text-muted">
          A quiet, private archive of records and notes.
        </p>
      </header>

      {/* At-a-glance stat tiles */}
      <section aria-label="Vault overview" className="mb-12">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Entries" value={total} hint="total records" />
          <StatTile
            label="Categories"
            value={categories.length}
            hint={categories.length === 1 ? "collection" : "collections"}
          />
          <StatTile label="Tags" value={tagSet.size} hint="distinct" />
          <StatTile
            label="Status"
            value={
              <span className="flex items-baseline gap-1">
                {published}
                <span className="font-mono text-base text-faint">
                  / {total}
                </span>
              </span>
            }
            hint={`${drafts} draft${drafts === 1 ? "" : "s"}`}
          />
          <StatTile
            label="Last updated"
            value={
              <span className="font-serif text-xl leading-tight">
                {formatDate(mostRecentDate)}
              </span>
            }
            hint="most recent"
          />
        </dl>
      </section>

      {/* Recently updated */}
      <section className="mb-12">
        <SectionHeading
          title="Recently updated"
          count={recent.length}
          action={{ href: "/vault", label: "All entries" }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {recent.map((entry) => (
            <EntryCard key={`${entry.category}/${entry.slug}`} entry={entry} />
          ))}
        </div>
      </section>

      {/* Browse by category */}
      <section>
        <SectionHeading title="Browse by category" count={categories.length} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryStats.map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              count={cat.count}
              published={cat.published}
            />
          ))}
        </div>
      </section>

      <PonchoBanner />
    </AppShell>
  );
}
