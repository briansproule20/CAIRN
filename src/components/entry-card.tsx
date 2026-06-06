import Link from "next/link";
import type { VaultEntry } from "@/lib/vault";
import { Badge } from "@/components/ui/badge";

/**
 * EntryCard — shared card linking to a single vault entry.
 * Server-safe primitive. Used on the home page, category pages, tag pages.
 *
 *   import { EntryCard } from "@/components/entry-card";
 *   <EntryCard entry={entry} />
 *
 * Props: { entry: VaultEntry }
 */
export function EntryCard({ entry }: { entry: VaultEntry }) {
  const date = entry.updated || entry.created;

  return (
    <Link
      href={`/vault/${entry.category}/${entry.slug}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 outline-none transition-colors duration-150 hover:border-border-strong hover:bg-surface-2 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {/* accent rule that warms on hover */}
      <span
        aria-hidden
        className="absolute inset-y-3 left-0 w-px bg-transparent transition-colors duration-150 group-hover:bg-accent-dim"
      />

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base leading-snug text-text transition-colors group-hover:text-accent-soft">
          {entry.title}
        </h3>
        <Badge variant="status">{entry.status}</Badge>
      </div>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="tag">
              {tag}
            </Badge>
          ))}
          {entry.tags.length > 4 && (
            <span className="font-mono text-[0.6875rem] text-faint">
              +{entry.tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 font-mono text-[0.6875rem] text-faint">
        <span className="capitalize">{entry.category.replace(/-/g, " ")}</span>
        {date && (
          <>
            <span aria-hidden>·</span>
            <time dateTime={date}>{date}</time>
          </>
        )}
      </div>
    </Link>
  );
}

export default EntryCard;
