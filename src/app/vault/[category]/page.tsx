import { Sidebar } from "@/components/sidebar";
import { EntryCard } from "@/components/entry-card";
import { getCategories, getEntriesByCategory } from "@/lib/vault";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getCategories().map((category) => ({ category }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categories = getCategories();
  if (!categories.includes(category)) notFound();

  const entries = getEntriesByCategory(category);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-4xl">
        <div className="space-y-1 mb-8">
          <h1 className="text-xl font-semibold capitalize">{category.replace(/-/g, " ")}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="grid gap-2">
          {entries.map((entry) => (
            <EntryCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </main>
    </div>
  );
}
