import Link from "next/link";
import { CairnMark } from "@/components/cairn-mark";

/**
 * EmptyVault — graceful empty state shown when the vault has no entries yet.
 * Server-safe. Echoes the cairn motif and points the user at the first action.
 */
export function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <CairnMark className="mb-6 h-12 w-10 text-accent-dim" />

      <h2 className="font-serif text-2xl text-text">Your vault is empty</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        CAIRN is a quiet place for your notes and records. Stack your first
        stone — add a category folder with an{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.8125rem] text-accent-dim">
          .mdx
        </code>{" "}
        file under{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.8125rem] text-accent-dim">
          /vault
        </code>
        , and it will appear here.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/editor"
          className="rounded-lg border border-accent-dim/50 bg-accent/10 px-4 py-2 font-mono text-xs text-accent-soft transition-colors duration-150 hover:border-accent hover:bg-accent/15"
        >
          + New Entry
        </Link>
      </div>

      <p className="mt-6 max-w-sm font-mono text-[0.6875rem] leading-relaxed text-faint">
        Frontmatter: title · category · tags · status · created · updated
      </p>
    </div>
  );
}

export default EmptyVault;
