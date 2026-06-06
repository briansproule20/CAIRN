"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Copy a chat's final answer, or push it into the editor as a vault draft. */
export function ChatActions({ markdown }: { markdown: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!markdown.trim()) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  function openInEditor() {
    try {
      window.localStorage.setItem("cairn_draft", markdown);
    } catch {
      /* ignore */
    }
    router.push("/editor");
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-text"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={openInEditor}
        className="rounded-lg border border-accent-dim/50 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:border-accent-dim hover:bg-accent/10"
      >
        Save to Vault
      </button>
    </div>
  );
}

export default ChatActions;
