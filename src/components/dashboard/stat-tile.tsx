import type { ReactNode } from "react";

/**
 * StatTile — a single at-a-glance metric for the dashboard.
 * Server-safe presentational primitive.
 *
 * Props:
 *  - label:    short metric name (mono caption).
 *  - value:    the headline figure (serif).
 *  - hint?:    optional secondary detail under the value.
 *  - icon?:    optional decorative glyph in the corner.
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="group relative flex flex-col gap-1 overflow-hidden rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-faint">
          {label}
        </span>
        {icon && (
          <span
            aria-hidden
            className="text-accent-dim transition-colors duration-150 group-hover:text-accent"
          >
            {icon}
          </span>
        )}
      </div>
      <span className="font-serif text-3xl leading-none text-text">{value}</span>
      {hint && (
        <span className="mt-0.5 font-mono text-[0.6875rem] text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

export default StatTile;
