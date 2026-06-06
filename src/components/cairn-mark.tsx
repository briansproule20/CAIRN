/**
 * CairnMark — the CAIRN brand glyph: four stacked stones with uniform spacing.
 * The single source of truth for the logo; use it everywhere (size + color via
 * className, e.g. `h-6 w-5 text-accent`). viewBox aspect is 5:6.
 */
export function CairnMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <ellipse cx="20" cy="40" rx="13" ry="4" />
      <ellipse cx="20" cy="30" rx="10.5" ry="4" opacity="0.82" />
      <ellipse cx="20" cy="20" rx="8" ry="4" opacity="0.66" />
      <ellipse cx="20" cy="10" rx="5.5" ry="4" opacity="0.5" />
    </svg>
  );
}

export default CairnMark;
