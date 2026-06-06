import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getAllTags } from "@/lib/repo/nodes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tags · CAIRN" };

export default async function TagsPage() {
  const ownerId = await getCurrentUserId();
  const tags = ownerId ? await getAllTags(ownerId) : [];
  const max = tags.reduce((m, t) => Math.max(m, t.count), 1);

  function sizeClass(count: number): string {
    const r = count / max;
    if (r > 0.75) return "text-2xl";
    if (r > 0.5) return "text-xl";
    if (r > 0.25) return "text-lg";
    return "text-base";
  }

  return (
    <AppShell
      title="Tags"
      breadcrumb={
        <Link href="/" className="text-muted transition-colors hover:text-text">
          Vault
        </Link>
      }
    >
      <header className="mb-8 space-y-1.5">
        <h1 className="font-serif text-3xl text-text">Tags</h1>
        <p className="font-mono text-xs text-muted">
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </p>
      </header>

      {tags.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">No tags yet.</p>
          <p className="mt-1 text-xs text-faint">
            Add tags to an entry to see them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className={`group inline-flex items-baseline gap-1.5 font-serif lowercase text-text transition-colors hover:text-accent-soft ${sizeClass(
                count
              )}`}
            >
              <span>{tag}</span>
              <span className="font-mono text-[0.6875rem] text-faint transition-colors group-hover:text-accent-dim">
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
