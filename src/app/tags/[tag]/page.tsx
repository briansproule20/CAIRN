import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EntryCard } from "@/components/entry-card";
import { Badge } from "@/components/ui/badge";
import { getAllTags, getEntriesByTag } from "@/lib/vault";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);

  const entries = getEntriesByTag(tag);
  if (entries.length === 0) notFound();

  // Categories this tag spans, for a quick orienting summary.
  const categories = Array.from(
    new Set(entries.map((e) => e.category))
  ).sort();

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} across{" "}
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </span>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <Link key={cat} href={`/vault/${cat}`}>
                <Badge variant="neutral" className="hover:border-border-strong">
                  {cat.replace(/-/g, " ")}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <EntryCard key={`${entry.category}/${entry.slug}`} entry={entry} />
        ))}
      </div>
    </AppShell>
  );
}
