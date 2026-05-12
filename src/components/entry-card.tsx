import Link from "next/link";
import type { VaultEntry } from "@/lib/vault";

export function EntryCard({ entry }: { entry: VaultEntry }) {
  return (
    <Link
      href={`/vault/${entry.category}/${entry.slug}`}
      className="block p-4 rounded-lg border transition-colors hover:bg-white/[0.02]"
      style={{ borderColor: "var(--border)" }}
    >
      <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {entry.title}
      </h3>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-1.5 py-0.5 rounded capitalize"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
        >
          {entry.status}
        </span>
        {entry.tags.slice(0, 3).map((tag) => (
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
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {entry.updated}
        </p>
      )}
    </Link>
  );
}
