import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/**
 * CategoryCard — tactile card representing one vault category.
 * Server-safe. Links to /vault/[category].
 *
 * Props:
 *  - name:        category slug (lowercase-hyphenated).
 *  - count:       number of entries in the category.
 *  - published? : optional count of published entries (shown as a sub-hint).
 */
export function CategoryCard({
  name,
  count,
  published,
}: {
  name: string;
  count: number;
  published?: number;
}) {
  const label = name.replace(/-/g, " ");
  const entryWord = count === 1 ? "entry" : "entries";

  return (
    <Link
      href={`/vault/${name}`}
      className="group relative flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 outline-none transition-colors duration-150 hover:border-border-strong hover:bg-surface-2 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span
        aria-hidden
        className="absolute inset-y-3 left-0 w-px bg-transparent transition-colors duration-150 group-hover:bg-accent-dim"
      />

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="truncate font-serif text-base capitalize leading-snug text-text transition-colors group-hover:text-accent-soft">
          {label}
        </h3>
        <span className="font-mono text-[0.6875rem] text-faint">
          {count} {entryWord}
          {typeof published === "number" && published > 0 && (
            <> · {published} published</>
          )}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="neutral">{count}</Badge>
        <span
          aria-hidden
          className="font-mono text-sm text-faint transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
        >
          →
        </span>
      </div>
    </Link>
  );
}

export default CategoryCard;
