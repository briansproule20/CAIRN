"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/** Delete a folder (and its whole subtree) from the folder view. */
export function FolderActions({
  id,
  parentPath,
  title,
}: {
  id: string;
  parentPath: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (
      !window.confirm(
        `Delete "${title}" and everything inside it? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/nodes/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(parentPath);
        router.refresh();
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      title="Delete folder"
      aria-label="Delete folder"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:text-accent-soft disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export default FolderActions;
