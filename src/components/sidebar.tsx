import Link from "next/link";
import { getCategories } from "@/lib/vault";

export function Sidebar() {
  const categories = getCategories();

  return (
    <aside
      className="w-56 min-h-screen shrink-0 border-r px-4 py-6 space-y-6"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <Link href="/" className="block text-lg font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
        CAIRN
      </Link>

      <nav className="space-y-1">
        {categories.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            No categories yet. Add folders to /vault to get started.
          </p>
        ) : (
          categories.map((cat) => (
            <Link
              key={cat}
              href={`/vault/${cat}`}
              className="block px-2 py-1.5 rounded text-sm capitalize transition-colors hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              {cat.replace(/-/g, " ")}
            </Link>
          ))
        )}
      </nav>

      <div className="pt-4 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/editor"
          className="block px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
        >
          + New Entry
        </Link>
      </div>
    </aside>
  );
}
