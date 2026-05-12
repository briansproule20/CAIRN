import { Sidebar } from "@/components/sidebar";
import { getCategories, getEntriesByCategory, getEntry } from "@/lib/vault";
import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import { MDXContent } from "@/components/mdx-content";
import Link from "next/link";

export function generateStaticParams() {
  return getCategories().flatMap((category) =>
    getEntriesByCategory(category).map((entry) => ({
      category,
      slug: entry.slug,
    }))
  );
}

export default async function EntryPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const entry = getEntry(category, slug);
  if (!entry) notFound();

  const mdxSource = await serialize(entry.content);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-3xl">
        <Link
          href={`/vault/${category}`}
          className="text-xs mb-4 inline-block transition-colors hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          {category.replace(/-/g, " ")}
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold">{entry.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-1.5 py-0.5 rounded capitalize"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
            >
              {entry.status}
            </span>
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-tertiary)", color: "var(--accent-dim)" }}
              >
                {tag}
              </span>
            ))}
          </div>
          {entry.updated && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Updated {entry.updated}
            </p>
          )}
        </div>

        <MDXContent source={mdxSource} />
      </main>
    </div>
  );
}
