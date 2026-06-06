import { AppShell } from "@/components/app-shell";
import { CategoryCard } from "@/components/dashboard/category-card";
import { EmptyVault } from "@/components/dashboard/empty-vault";
import { getCategories, getEntriesByCategory } from "@/lib/vault";

export const metadata = { title: "Vault · CAIRN" };

export default function VaultPage() {
  const categories = getCategories();

  if (categories.length === 0) {
    return (
      <AppShell title="Vault">
        <header className="mb-8">
          <h1 className="font-serif text-3xl text-text">Vault</h1>
          <p className="mt-1 text-sm text-muted">
            Your highest-level sections live here.
          </p>
        </header>
        <EmptyVault />
      </AppShell>
    );
  }

  const stats = categories.map((name) => {
    const entries = getEntriesByCategory(name);
    return {
      name,
      count: entries.length,
      published: entries.filter((e) => e.status?.toLowerCase() === "published")
        .length,
    };
  });

  return (
    <AppShell title="Vault">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-text">Vault</h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {categories.length} {categories.length === 1 ? "section" : "sections"}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((c) => (
          <CategoryCard
            key={c.name}
            name={c.name}
            count={c.count}
            published={c.published}
          />
        ))}
      </div>
    </AppShell>
  );
}
