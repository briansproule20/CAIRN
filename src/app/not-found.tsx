import Link from "next/link";
import { CairnMark } from "@/components/cairn-mark";

/**
 * 404 — a quiet dead-end. The stacked-stone mark is itself the link onward:
 * a small, unadvertised nod toward /cairn for anyone who notices the stones
 * are clickable.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
      <Link
        href="/cairn"
        aria-label="A cairn marks the way"
        className="group inline-flex flex-col items-center"
      >
        <CairnMark className="h-16 w-14 text-accent-dim transition-colors duration-500 group-hover:text-accent" />
      </Link>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.34em] text-faint">
        404 · off the trail
      </p>
      <h1 className="mt-3 font-serif text-2xl text-text">
        Nothing stacked here.
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        This path doesn&rsquo;t lead anywhere. Follow the stones back to{" "}
        <Link
          href="/"
          className="text-accent underline decoration-accent-dim underline-offset-4 transition-colors hover:text-accent-soft"
        >
          the vault
        </Link>
        .
      </p>
    </main>
  );
}
