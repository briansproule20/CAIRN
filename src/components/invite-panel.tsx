"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Invite {
  code: string;
  used: boolean;
  createdAt: string;
}

export function InvitePanel() {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/invites");
      const data = await res.json();
      if (res.ok) setInvites(data.invites ?? []);
      else setError(data.error || "Failed to load invites.");
    } catch {
      setError("Failed to load invites.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function mint() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/invites", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't mint an invite.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't mint an invite.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={mint} disabled={busy} variant="outline">
        {busy ? "Minting…" : "Mint invite code"}
      </Button>

      {error && <p className="text-sm text-accent-soft">{error}</p>}

      {invites && invites.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {invites.map((inv) => (
            <li
              key={inv.code}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <code
                className={`font-mono text-sm ${
                  inv.used ? "text-faint line-through" : "text-text"
                }`}
              >
                {inv.code}
              </code>
              <div className="flex items-center gap-2">
                {inv.used ? (
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
                    used
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => copy(inv.code)}
                    className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-text"
                  >
                    {copied === inv.code ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {invites && invites.length === 0 && (
        <p className="text-xs text-faint">
          No invites yet. Mint one to add someone.
        </p>
      )}
    </div>
  );
}

export default InvitePanel;
