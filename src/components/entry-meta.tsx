import Link from "next/link";
import type { VaultEntry } from "@/lib/vault";
import { Badge } from "@/components/ui/badge";

/**
 * EntryMeta — the masthead metadata block for a single vault entry.
 * Server-safe. Renders the category breadcrumb link, serif title,
 * status + tag Badges, and created/updated dates in mono.
 *
 *   import { EntryMeta } from "@/components/entry-meta";
 *   <EntryMeta entry={entry} />
 */
export function EntryMeta({ entry }: { entry: VaultEntry }) {
  const categoryLabel = entry.category.replace(/-/g, " ");
  const showUpdated = entry.updated && entry.updated !== entry.created;

  return (
    <header className="mb-10 border-b border-border pb-8">
      <Link
        href={`/vault/${entry.category}`}
        className="group inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent-soft"
      >
        <span
          aria-hidden
          className="text-accent-dim transition-colors group-hover:text-accent"
        >
          ←
        </span>
        <span className="capitalize">{categoryLabel}</span>
      </Link>

      <h1 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-text sm:text-4xl">
        {entry.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Badge variant="status">{entry.status}</Badge>
        {entry.tags.map((tag) => (
          <Badge key={tag} variant="tag">
            {tag}
          </Badge>
        ))}
      </div>

      {(entry.created || showUpdated) && (
        <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.6875rem] text-faint">
          {entry.created && (
            <div className="flex items-center gap-1.5">
              <dt className="uppercase tracking-[0.1em]">Created</dt>
              <dd>
                <time dateTime={entry.created} className="text-muted">
                  {entry.created}
                </time>
              </dd>
            </div>
          )}
          {showUpdated && (
            <div className="flex items-center gap-1.5">
              <dt className="uppercase tracking-[0.1em]">Updated</dt>
              <dd>
                <time dateTime={entry.updated} className="text-muted">
                  {entry.updated}
                </time>
              </dd>
            </div>
          )}
        </dl>
      )}
    </header>
  );
}

export default EntryMeta;
