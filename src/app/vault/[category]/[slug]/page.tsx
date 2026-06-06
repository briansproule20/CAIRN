import Link from "next/link";
import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import { getCategories, getEntriesByCategory, getEntry } from "@/lib/vault";
import { AppShell } from "@/components/app-shell";
import { MDXContent } from "@/components/mdx-content";
import { EntryMeta } from "@/components/entry-meta";
import { Toc, extractHeadings } from "@/components/toc";

export function generateStaticParams() {
  return getCategories().flatMap((category) =>
    getEntriesByCategory(category).map((entry) => ({
      category,
      slug: entry.slug,
    }))
  );
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const entry = getEntry(category, slug);
  if (!entry) notFound();

  const mdxSource = await serialize(entry.content);
  const headings = extractHeadings(entry.content);

  // Prev / next within the category (entries are title-sorted in vault.ts).
  const siblings = getEntriesByCategory(category);
  const index = siblings.findIndex((e) => e.slug === slug);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next =
    index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const categoryLabel = category.replace(/-/g, " ");

  return (
    <AppShell
      title={<span className="line-clamp-1">{entry.title}</span>}
      breadcrumb={
        <Link
          href={`/vault/${category}`}
          className="capitalize text-muted transition-colors hover:text-text"
        >
          {categoryLabel}
        </Link>
      }
    >
      <div className="flex gap-12">
        <article className="min-w-0 flex-1">
          <EntryMeta entry={entry} />

          <MDXContent source={mdxSource} />

          {(prev || next) && (
            <nav
              aria-label="Entry navigation"
              className="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
            >
              {prev ? (
                <Link
                  href={`/vault/${category}/${prev.slug}`}
                  className="group flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-faint">
                    ← Previous
                  </span>
                  <span className="font-serif text-base leading-snug text-text transition-colors group-hover:text-accent-soft">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden className="hidden sm:block" />
              )}

              {next && (
                <Link
                  href={`/vault/${category}/${next.slug}`}
                  className="group flex flex-col items-end gap-1.5 rounded-xl border border-border bg-surface p-4 text-right transition-colors hover:border-border-strong hover:bg-surface-2 sm:col-start-2"
                >
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-faint">
                    Next →
                  </span>
                  <span className="font-serif text-base leading-snug text-text transition-colors group-hover:text-accent-soft">
                    {next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </article>

        {headings.length > 0 && (
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">
              <Toc headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
