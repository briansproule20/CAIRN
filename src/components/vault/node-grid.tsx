import Link from "next/link";
import { Folder, FileText } from "lucide-react";

export interface NodeCard {
  slug: string;
  title: string;
  kind: "folder" | "entry";
  count?: number;
  status?: string;
}

/** Cards for a folder's children. `basePath` is the current vault URL. */
export function NodeGrid({
  items,
  basePath,
}: {
  items: NodeCard[];
  basePath: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.slug}
          href={`${basePath}/${it.slug}`}
          className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent-dim hover:bg-accent/[0.03]"
        >
          <span className="mt-0.5 shrink-0 text-accent-dim transition-colors group-hover:text-accent">
            {it.kind === "folder" ? (
              <Folder className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-base text-text transition-colors group-hover:text-accent-soft">
              {it.title}
            </p>
            <p className="mt-1 font-mono text-[0.6875rem] text-faint">
              {it.kind === "folder"
                ? `${it.count ?? 0} ${it.count === 1 ? "item" : "items"}`
                : "entry"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default NodeGrid;
