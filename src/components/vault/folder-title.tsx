"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

/** A folder/section title that renames inline (click → edit → PATCH → refresh). */
export function FolderTitle({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);

  function cancel() {
    setEditing(false);
    setValue(title);
  }

  async function save() {
    const next = value.trim();
    if (!next || next === title) {
      cancel();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/nodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        aria-label="Section title"
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-2 py-1 font-serif text-3xl text-text outline-none transition-colors focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(title);
        setEditing(true);
      }}
      title="Rename"
      className="group inline-flex min-w-0 items-center gap-2 text-left"
    >
      <h1 className="truncate font-serif text-3xl text-text">{title}</h1>
      <Pencil className="h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default FolderTitle;
