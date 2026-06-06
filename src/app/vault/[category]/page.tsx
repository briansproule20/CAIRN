import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CategoryFilter } from "@/components/category-filter";
import { getCategories, getEntriesByCategory } from "@/lib/vault";

export function generateStaticParams() {
  return getCategories().map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!getCategories().includes(category)) notFound();

  const entries = getEntriesByCategory(category);
  const label = category.replace(/-/g, " ");

  return (
    <AppShell
      title={<span className="capitalize">{label}</span>}
      breadcrumb={
        <Link href="/" className="text-muted transition-colors hover:text-text">
          Vault
        </Link>
      }
    >
      <header className="mb-8 space-y-1.5">
        <h1 className="font-serif text-3xl capitalize text-text">{label}</h1>
        <p className="font-mono text-xs text-muted">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            No entries in this category yet.
          </p>
        </div>
      ) : (
        <CategoryFilter entries={entries} />
      )}
    </AppShell>
  );
}
