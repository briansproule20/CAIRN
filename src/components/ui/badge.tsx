import type { ReactNode } from "react";

/**
 * Badge — small shared pill primitive (server-safe).
 *
 * Variants:
 *  - "status"    : neutral status pill (draft / published). Pass the status
 *                  string as children; "published" is auto-accented.
 *  - "tag"       : tag chip (warm, low-contrast).
 *  - "neutral"   : generic count / meta pill.
 *
 * Usage:
 *   import { Badge } from "@/components/ui/badge";
 *   <Badge variant="status">published</Badge>
 *   <Badge variant="tag">lore</Badge>
 *   <Badge variant="neutral">12</Badge>
 */
export type BadgeVariant = "status" | "tag" | "neutral";

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium leading-none whitespace-nowrap transition-colors";

  const isPublished =
    variant === "status" &&
    typeof children === "string" &&
    children.toLowerCase() === "published";

  let variantClasses: string;
  if (variant === "status") {
    variantClasses = isPublished
      ? "border-accent-dim/40 bg-accent/10 text-accent-soft"
      : "border-border bg-surface-2 text-muted";
  } else if (variant === "tag") {
    variantClasses =
      "border-border bg-surface-2/60 text-muted font-mono lowercase tracking-tight";
  } else {
    variantClasses = "border-border bg-surface-2 text-muted font-mono";
  }

  return (
    <span className={`${base} ${variantClasses} ${className}`}>
      {variant === "status" && (
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            isPublished ? "bg-accent" : "bg-faint"
          }`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
