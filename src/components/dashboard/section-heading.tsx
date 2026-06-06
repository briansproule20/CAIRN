import type { ReactNode } from "react";
import Link from "next/link";

/**
 * SectionHeading — a consistent serif section header for the dashboard,
 * with an optional count and an optional "see all" link on the right.
 * Server-safe presentational primitive.
 */
export function SectionHeading({
  title,
  count,
  action,
}: {
  title: ReactNode;
  count?: number;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <h2 className="flex items-baseline gap-2 font-serif text-xl text-text">
        {title}
        {typeof count === "number" && (
          <span className="font-mono text-xs text-faint">{count}</span>
        )}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 font-mono text-xs text-muted transition-colors duration-150 hover:text-accent-soft"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export default SectionHeading;
