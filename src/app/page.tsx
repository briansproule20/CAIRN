import { Sidebar } from "@/components/sidebar";
import { EntryCard } from "@/components/entry-card";
import { getCategories, getEntriesByCategory } from "@/lib/vault";

export default function HomePage() {
  const categories = getCategories();
  const recentEntries = categories
    .flatMap(getEntriesByCategory)
    .sort((a, b) => (b.updated || b.created || "").localeCompare(a.updated || a.created || ""))
    .slice(0, 12);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-4xl">
        <div className="space-y-1 mb-8">
          <h1 className="text-xl font-semibold">Vault</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {categories.length} categories, {recentEntries.length} entries
          </p>
        </div>

        {categories.length === 0 ? (
          <div
            className="rounded-lg border p-8 text-center space-y-3"
            style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No vault content yet.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Add category folders and .mdx files to the <code>/vault</code> directory to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => {
              const entries = getEntriesByCategory(cat);
              if (entries.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="text-sm font-medium uppercase tracking-wider mb-3 capitalize" style={{ color: "var(--accent-dim)" }}>
                    {cat.replace(/-/g, " ")}
                  </h2>
                  <div className="grid gap-2">
                    {entries.map((entry) => (
                      <EntryCard key={entry.slug} entry={entry} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
